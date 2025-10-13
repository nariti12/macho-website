"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  RotateCcw,
  UserRound,
} from "lucide-react";
import {
  Freq,
  Gender,
  TrainType,
  getProgramValue,
  isValidFreq,
  isValidGender,
  isValidTrainType,
} from "@/data/programs";

const cn = (...classes: Array<string | null | false | undefined>) =>
  classes.filter(Boolean).join(" ");

const profileImageSrc = "/picture/ore.png";

const wizardSteps = [
  {
    id: 0,
    label: "性別を選択",
    description: "自分の性別を選んでください",
    icon: UserRound,
  },
  {
    id: 1,
    label: "トレーニングタイプを選択",
    description: "ジムか自宅かを選んでください",
    icon: Dumbbell,
  },
  {
    id: 2,
    label: "頻度を選択",
    description: "週に何回トレーニングしますか？",
    icon: CalendarRange,
  },
] as const;

const genderOptions: Array<{ value: Gender; label: string; helper: string }> = [
  { value: "male", label: "男性", helper: "筋肉バキバキ範馬バキを目指されたい方" },
  { value: "female", label: "女性", helper: "より美しくしなやかな身体を目指されたい方" },
];

const typeOptions: Array<{ value: TrainType; label: string; helper: string }> = [
  { value: "gym", label: "ジムトレ", helper: "器具を使った高強度トレ" },
  { value: "home", label: "家トレ（自重）", helper: "自宅で気軽に継続" },
];

const frequencyOptions: Array<{ value: Freq; label: string }> = [
  { value: "1-2", label: "週1-2回" },
  { value: "3", label: "週3回" },
  { value: "4", label: "週4回" },
  { value: "5", label: "週5回" },
  { value: "6", label: "週6回" },
  { value: "7", label: "週7回" },
];

const filterFrequencyOptions = (
  gender: Gender | null,
  type: TrainType | null,
): Array<{ value: Freq; label: string }> => {
  if (gender === "female" && type === "gym") {
    return frequencyOptions.filter((option) => option.value === "1-2" || option.value === "3");
  }
  return frequencyOptions;
};

type ToastState = {
  message: string;
  kind: "info" | "error";
};

export function MenuWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedType, setSelectedType] = useState<TrainType | null>(null);
  const [selectedFreq, setSelectedFreq] = useState<Freq | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const hasHydratedFromParams = useRef(false);

  const syncParams = useCallback(
    (gender: Gender | null, type: TrainType | null, freq: Freq | null) => {
      const params = new URLSearchParams();
      if (gender) params.set("gender", gender);
      if (type) params.set("type", type);
      if (freq) params.set("freq", freq);
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router],
  );

  // Parse search params on first render or when invalid values are provided.
  useEffect(() => {
    const genderParam = searchParams.get("gender");
    const typeParam = searchParams.get("type");
    const freqParam = searchParams.get("freq");

    const gender = isValidGender(genderParam) ? genderParam : null;
    const trainType = isValidTrainType(typeParam) ? typeParam : null;
    const freq = isValidFreq(freqParam) ? freqParam : null;

    const hasInvalid = Boolean(
      (genderParam && !gender) ||
        (typeParam && !trainType) ||
        (freqParam && !freq),
    );

    if (hasInvalid) {
      setToast({
        message: "不正なパラメーターを検出したため診断を初期化しました。",
        kind: "error",
      });
      setSelectedGender(null);
      setSelectedType(null);
      setSelectedFreq(null);
      setActiveStep(0);
      hasHydratedFromParams.current = true;
      syncParams(null, null, null);
      return;
    }

    const skipFromParams = trainType === "home";
    const allowedForParams = filterFrequencyOptions(gender, trainType);
    const normalizedFreq = skipFromParams
      ? null
      : freq && allowedForParams.some((option) => option.value === freq)
        ? freq
        : null;

    setSelectedGender(gender);
    setSelectedType(trainType);
    setSelectedFreq(normalizedFreq);

    if (skipFromParams && freq) {
      syncParams(gender, trainType, null);
    } else if (!skipFromParams && freq && normalizedFreq !== freq) {
      syncParams(gender, trainType, normalizedFreq);
    }

    if (!hasHydratedFromParams.current) {
      let initialStep = 0;
      if (gender) initialStep = 1;
      if (gender && trainType) {
        initialStep = skipFromParams ? wizardSteps.length - 1 : 2;
      }
      if (gender && trainType && !skipFromParams && freq) {
        initialStep = wizardSteps.length;
      }
      setActiveStep(initialStep);
      hasHydratedFromParams.current = true;
    }
  }, [searchParams, syncParams]);

  // Auto-hide toast.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleGenderSelect = useCallback(
    (value: Gender) => {
      const nextType = selectedType;
      const willSkip = nextType === "home";
      const allowed = filterFrequencyOptions(value, nextType);
      const nextFreq = willSkip
        ? null
        : selectedFreq && allowed.some((option) => option.value === selectedFreq)
          ? selectedFreq
          : null;
      setSelectedGender(value);
      setSelectedFreq(nextFreq);
      syncParams(value, nextType, nextFreq);
    },
    [selectedFreq, selectedType, syncParams],
  );

  const handleTypeSelect = useCallback(
    (value: TrainType) => {
      const allowed = filterFrequencyOptions(selectedGender, value);
      const nextFreq =
        selectedFreq && allowed.some((option) => option.value === selectedFreq)
          ? selectedFreq
          : null;
      setSelectedType(value);
      setSelectedFreq(nextFreq);
      syncParams(selectedGender, value, nextFreq);
    },
    [selectedGender, selectedFreq, syncParams],
  );

  const handleFreqSelect = useCallback(
    (value: Freq) => {
      setSelectedFreq(value);
      syncParams(selectedGender, selectedType, value);
    },
    [selectedGender, selectedType, syncParams],
  );

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setSelectedGender(null);
    setSelectedType(null);
    setSelectedFreq(null);
    setActiveStep(0);
    syncParams(null, null, null);
  };

  const programValue = useMemo(
    () => getProgramValue(selectedGender, selectedType, selectedFreq),
    [selectedFreq, selectedGender, selectedType],
  );

  const shouldSkipFrequency = selectedType === "home";
  const steps = useMemo(
    () => (shouldSkipFrequency ? wizardSteps.filter((step) => step.id !== 2) : wizardSteps),
    [shouldSkipFrequency],
  );
  const totalSteps = steps.length;

  const selectedGenderLabel = useMemo(
    () => genderOptions.find((option) => option.value === selectedGender)?.label ?? null,
    [selectedGender],
  );
  const selectedTypeLabel = useMemo(
    () => typeOptions.find((option) => option.value === selectedType)?.label ?? null,
    [selectedType],
  );
  const selectedFreqLabel = useMemo(
    () => frequencyOptions.find((option) => option.value === selectedFreq)?.label ?? null,
    [selectedFreq],
  );

  const frequencyChoices = useMemo(
    () => filterFrequencyOptions(selectedGender, selectedType),
    [selectedGender, selectedType],
  );

  const isReadyForResult = Boolean(
    selectedGender && selectedType && (shouldSkipFrequency || selectedFreq),
  );
  const isFinalStep = activeStep >= totalSteps;

  const currentStepIndex = totalSteps > 0 ? Math.min(activeStep, totalSteps - 1) : 0;
  const progressRatio = totalSteps > 0 ? Math.min(activeStep, totalSteps) / totalSteps : 0;
  const currentStep = !isFinalStep && totalSteps > 0 ? steps[currentStepIndex] : null;
  const canGoNext = !isFinalStep
    ? currentStep?.id === 0
      ? Boolean(selectedGender)
      : currentStep?.id === 1
        ? Boolean(selectedType)
        : currentStep?.id === 2
          ? Boolean(selectedFreq)
          : false
    : false;

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <header className="px-4 pt-4 pb-3 sm:px-6 md:sticky md:top-4 md:px-12 md:pt-6 md:pb-4">
        <Link
          href="/"
          className="flex flex-col items-center justify-between gap-3 rounded-3xl text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 md:flex-row md:items-start md:gap-6"
        >
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-6xl">マチョ田の部屋</h1>
            <p className="mt-1 text-xs font-medium sm:text-sm md:text-xl">〜筋トレについてもう悩まなくていい〜</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-left text-[#7C2D12] shadow-lg transition hover:scale-[1.02] hover:bg-white md:flex-col md:bg-white md:px-5 md:py-4 md:text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white md:h-24 md:w-24 md:rounded-2xl">
              <Image
                src={profileImageSrc}
                alt="Profile"
                width={80}
                height={80}
                priority
                className="h-10 w-10 rounded-md object-cover md:h-20 md:w-20"
              />
            </div>
            <p className="text-xs font-semibold sm:text-sm md:mt-2 md:text-base md:text-[#7C2D12]">Profile</p>
          </div>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16 md:gap-12 md:px-6 md:pb-10">

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6 rounded-[32px] border border-white/70 bg-white/90 p-6 text-center shadow-xl shadow-[rgba(255,138,35,0.15)] backdrop-blur-sm md:text-left"
        >
          <h1 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl md:text-4xl">
            用途別 最強筋トレメニュー
          </h1>
          <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
            性別・トレーニングタイプ・頻度を選ぶだけ。あなたに最適なメニューをご提案します。
          </p>
        </motion.section>

        <section className="space-y-6 rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 shadow-xl shadow-[rgba(255,138,35,0.15)] backdrop-blur-sm">
          <header className="space-y-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-[var(--primary)]"
                animate={{ width: `${progressRatio * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStepIndex || (isFinalStep && index <= currentStepIndex);
                const isActive = !isFinalStep && currentStepIndex === index;
                const isResultActive = isFinalStep && index === steps.length - 1;
                const selectionText = step.id === 0
                  ? selectedGenderLabel
                  : step.id === 1
                    ? selectedTypeLabel
                    : step.id === 2
                      ? selectedFreqLabel
                      : null;

                return (
                  <div
                    key={step.id}
                    aria-current={isActive || isResultActive ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[28px] border px-4 py-3 shadow-sm transition-all",
                      isCompleted
                        ? "border-transparent bg-[var(--primary)] text-white shadow-lg"
                        : isActive || isResultActive
                          ? "border-[var(--primary)] bg-white text-[var(--primary)] shadow-md"
                          : "border-transparent bg-white/70 text-gray-600",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                        isCompleted
                          ? "bg-white/20 text-white"
                          : isActive || isResultActive
                            ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                            : "bg-white text-[var(--primary)]/70",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 md:text-base">
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-500 md:text-sm">{step.description}</span>
                      {(selectionText && (isCompleted || isActive || isResultActive)) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                          選択中 {selectionText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </header>

          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              {!isFinalStep ? (
                <motion.div
                  key={`step-${currentStepIndex}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {currentStep?.id === 0 && (
                    <StepGender
                      value={selectedGender}
                      onSelect={handleGenderSelect}
                    />
                  )}
                  {currentStep?.id === 1 && (
                    <StepType
                      value={selectedType}
                      onSelect={handleTypeSelect}
                      gender={selectedGender}
                    />
                  )}
                  {currentStep?.id === 2 && !shouldSkipFrequency && (
                    <StepFrequency
                      value={selectedFreq}
                      onSelect={handleFreqSelect}
                      options={frequencyChoices}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <ResultPanel
                    gender={selectedGender}
                    type={selectedType}
                    freq={selectedFreq}
                    value={programValue}
                    shouldSkipFrequency={shouldSkipFrequency}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <BottomNavBar
          onBack={handleBack}
          onNext={() => {
            if (activeStep === totalSteps - 1 && isReadyForResult) {
              setActiveStep(totalSteps);
              return;
            }
            handleNext();
          }}
          onReset={handleReset}
          canGoBack={activeStep > 0}
          canGoNext={canGoNext}
          isResultStep={isFinalStep}
          isReadyForResult={isReadyForResult}
          activeStep={activeStep}
          totalSteps={totalSteps}
        />

        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[24px] border px-4 py-3 shadow-xl backdrop-blur-sm",
                toast.kind === "error"
                  ? "border-[#ffd8d8] bg-[#fff2f2] text-[#c53030]"
                  : "border-white/70 bg-white/90 text-[var(--primary)]",
              )}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span>{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface StepGenderProps {
  value: Gender | null;
  onSelect: (value: Gender) => void;
}

function StepGender({ value, onSelect }: StepGenderProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">性別を選択</h2>
      <p className="text-sm text-gray-600">該当する性別を選択してください。</p>
      <div
        role="radiogroup"
        aria-labelledby="gender-group"
        className="grid gap-4 md:grid-cols-2"
      >
        <span id="gender-group" className="sr-only">
          性別を選択
        </span>
        {genderOptions.map((option) => (
          <RadioCard
            key={option.value}
            label={option.label}
            helper={option.helper}
            isSelected={value === option.value}
            onSelect={() => onSelect(option.value)}
            disabled={false}
          />
        ))}
      </div>
    </div>
  );
}

interface StepTypeProps {
  value: TrainType | null;
  gender: Gender | null;
  onSelect: (value: TrainType) => void;
}

function StepType({ value, gender, onSelect }: StepTypeProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">トレーニングタイプを選択</h2>
      <p className="text-sm text-gray-600">トレーニング環境を選択してください。</p>
      <div
        role="radiogroup"
        aria-labelledby="type-group"
        className="grid gap-4 md:grid-cols-2"
      >
        <span id="type-group" className="sr-only">
          トレーニングタイプを選択
        </span>
        {typeOptions.map((option) => (
          <RadioCard
            key={option.value}
            label={option.label}
            helper={option.helper}
            isSelected={value === option.value}
            onSelect={() => onSelect(option.value)}
            disabled={gender === null}
          />
        ))}
      </div>
      {gender === null && (
        <p className="text-xs font-medium text-[var(--primary)]">先に性別を選択してください。</p>
      )}
    </div>
  );
}

interface StepFrequencyProps {
  value: Freq | null;
  onSelect: (value: Freq) => void;
  options: Array<{ value: Freq; label: string }>;
}

function StepFrequency({ value, onSelect, options }: StepFrequencyProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">頻度を選択</h2>
      <p className="text-sm text-gray-600">週に何日トレーニングしたいですか？</p>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="トレーニング頻度">
        {options.map((option) => (
          <FrequencyPill
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            onSelect={() => onSelect(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

interface RadioCardProps {
  label: string;
  helper: string;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function RadioCard({ label, helper, isSelected, disabled, onSelect }: RadioCardProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled) onSelect();
        }
      }}
      tabIndex={disabled ? -1 : 0}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex h-full flex-col gap-2 rounded-[28px] border px-5 py-6 text-left transition-all backdrop-blur-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg",
        isSelected
          ? "border-[var(--primary)]/70 bg-white text-gray-900 shadow-lg ring-1 ring-[var(--primary)]/30"
          : "border-white/60 bg-white/80 text-gray-700 shadow-sm hover:border-[var(--primary)]/40",
      )}
    >
      <span className="text-lg font-semibold">{label}</span>
      <span className="text-sm text-gray-500">{helper}</span>
    </motion.button>
  );
}

interface FrequencyPillProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FrequencyPill({ label, isSelected, onSelect }: FrequencyPillProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "rounded-full border px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300",
        isSelected
          ? "border-transparent bg-[var(--primary)] text-white shadow-lg"
          : "border-white/60 bg-white/80 text-gray-700 hover:border-[var(--primary)]/40 hover:bg-white",
      )}
    >
      {label}
    </motion.button>
  );
}

interface ResultPanelProps {
  gender: Gender | null;
  type: TrainType | null;
  freq: Freq | null;
  value: ReturnType<typeof getProgramValue>;
  shouldSkipFrequency: boolean;
}

function ResultPanel({ gender, type, freq, value, shouldSkipFrequency }: ResultPanelProps) {
  const hasSelections = Boolean(gender && type && (shouldSkipFrequency || freq));

  if (!hasSelections) {
    return (
      <div className="rounded-[32px] border border-dashed border-white/70 bg-white/75 p-8 text-center text-gray-600 shadow-sm backdrop-blur-sm">
        条件をすべて選択すると結果が表示されます。
      </div>
    );
  }

  if (!value || value === "coming_soon") {
    return <ComingSoonCard />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="space-y-3 rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900">{value.title}</h2>
        <div className="space-y-2 text-sm leading-relaxed text-gray-700">
          {value.intro.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {value.days.map((day) => (
          <ProgramDayCard key={day.title} day={day} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-md backdrop-blur-sm"
      >
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          トレーニングのポイント
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-gray-700">
          {value.principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </motion.div>

    </motion.div>
  );
}

function ComingSoonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-[32px] border border-dashed border-[var(--primary)]/40 bg-white/90 p-8 text-center shadow-md backdrop-blur-sm"
    >
      <h2 className="text-xl font-semibold text-gray-900">最適なメニューを準備中...</h2>
      <p className="mt-3 text-sm text-gray-600">
        この条件のメニューは現在作成中です。公開まで少々お待ちください。
      </p>
    </motion.div>
  );
}

interface ProgramDayCardProps {
  day: {
    title: string;
    items: { name: string; reps: string; note?: string }[];
  };
}

function ProgramDayCard({ day }: ProgramDayCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-md backdrop-blur-sm"
    >
      <button
        type="button"
        className="flex items-center justify-between text-left text-lg font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {day.title}
        <span className="text-sm text-[var(--primary)]">{isOpen ? "閉じる" : "開く"}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            key="items"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-2 overflow-hidden text-sm text-gray-700"
          >
            {day.items.map((item) => (
              <li key={item.name} className="flex flex-col gap-1 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--primary)]">{item.reps}</span>
                {item.note && <span className="text-xs text-gray-500">{item.note}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

interface BottomNavBarProps {
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isResultStep: boolean;
  isReadyForResult: boolean;
  activeStep: number;
  totalSteps: number;
}

function BottomNavBar({
  onBack,
  onNext,
  onReset,
  canGoBack,
  canGoNext,
  isResultStep,
  isReadyForResult,
  activeStep,
  totalSteps,
}: BottomNavBarProps) {
  const isFinalSelectionStep = activeStep === totalSteps - 1;
  const nextLabel = isFinalSelectionStep && isReadyForResult ? "結果を見る" : "次へ";
  return (
    <div className="mx-auto mt-6 w-full max-w-5xl rounded-[24px] border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur md:sticky md:bottom-4 md:rounded-[28px] md:border-white/70 md:shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-[var(--primary)]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            戻る
          </button>
          {!isResultStep && (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-orange-300/70 disabled:shadow-none"
            >
              {nextLabel}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {isResultStep && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white opacity-95 shadow-lg"
            >
              結果表示中
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 shadow-sm transition hover:border-[var(--primary)]/40 hover:bg-white md:self-auto"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          リセット
        </button>
      </div>
    </div>
  );
}

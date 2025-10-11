"use client";

import { useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";

type Gender = "male" | "female";

type ActivityOption = {
  value: string;
  label: string;
  calorieFactor: number;
  proteinMale: number;
  proteinFemale: number;
};

const profileImageSrc = "/picture/ore.png";

const DEFAULT_WEIGHT = 70;
const DEFAULT_HEIGHT = 170;
const DEFAULT_AGE = 30;

const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 220;
const AGE_MIN = 15;
const AGE_MAX = 80;

const activityOptions: ActivityOption[] = [
  {
    value: "sedentary",
    label: "デスクワーク中心（ほぼ運動なし）",
    calorieFactor: 1.2,
    proteinMale: 1.4,
    proteinFemale: 1.2,
  },
  {
    value: "light",
    label: "軽い運動（週1〜2回）",
    calorieFactor: 1.375,
    proteinMale: 1.6,
    proteinFemale: 1.4,
  },
  {
    value: "moderate",
    label: "中程度の運動（週3〜5回）",
    calorieFactor: 1.55,
    proteinMale: 1.8,
    proteinFemale: 1.5,
  },
  {
    value: "active",
    label: "ハードな運動（週6〜7回）",
    calorieFactor: 1.725,
    proteinMale: 2.0,
    proteinFemale: 1.7,
  },
  {
    value: "athlete",
    label: "アスリートレベル（1日2回以上の運動）",
    calorieFactor: 1.9,
    proteinMale: 2.2,
    proteinFemale: 1.9,
  },
];

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const formatNumber = (value: number) => value.toLocaleString("ja-JP");

const getProteinMultiplier = (gender: Gender, activity: ActivityOption) => {
  return gender === "male" ? activity.proteinMale : activity.proteinFemale;
};

const parseInput = (value: string, fallback: number) => {
  if (value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateBmr = (gender: Gender, weight: number, height: number, age: number) => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
};

const calculateMaintenanceCalories = (
  gender: Gender,
  weight: number,
  height: number,
  age: number,
  activity: ActivityOption
) => {
  const bmr = calculateBmr(gender, weight, height, age);
  return Math.round(bmr * activity.calorieFactor);
};

const calculateProteinTarget = (gender: Gender, weight: number, activity: ActivityOption) => {
  const multiplier = getProteinMultiplier(gender, activity);
  return Math.round(weight * multiplier);
};

export function IntakeCalculator() {
  const [gender, setGender] = useState<Gender>("male");
  const [weightInput, setWeightInput] = useState(String(DEFAULT_WEIGHT));
  const [heightInput, setHeightInput] = useState(String(DEFAULT_HEIGHT));
  const [ageInput, setAgeInput] = useState(String(DEFAULT_AGE));
  const [activity, setActivity] = useState<ActivityOption>(activityOptions[2]);

  const results = useMemo(() => {
    const weightValue = parseInput(weightInput, DEFAULT_WEIGHT);
    const heightValue = parseInput(heightInput, DEFAULT_HEIGHT);
    const ageValue = parseInput(ageInput, DEFAULT_AGE);

    const safeWeight = clampNumber(weightValue, WEIGHT_MIN, WEIGHT_MAX);
    const safeHeight = clampNumber(heightValue, HEIGHT_MIN, HEIGHT_MAX);
    const safeAge = clampNumber(ageValue, AGE_MIN, AGE_MAX);

    const maintenanceCalories = calculateMaintenanceCalories(
      gender,
      safeWeight,
      safeHeight,
      safeAge,
      activity
    );
    const proteinTarget = calculateProteinTarget(gender, safeWeight, activity);
    const slightDeficit = Math.round(maintenanceCalories * 0.9);
    const slightSurplus = Math.round(maintenanceCalories * 1.1);

    return {
      maintenanceCalories,
      proteinTarget,
      calorieTargets: {
        cut: slightDeficit,
        maintain: maintenanceCalories,
        bulk: slightSurplus,
      },
      proteinPerMeal: Math.round(proteinTarget / 3),
    };
  }, [gender, weightInput, heightInput, ageInput, activity]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-6 pb-24 md:px-12">
        <section className="mx-auto flex max-w-5xl flex-col gap-10 pt-20">
          <div className="rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur sm:p-12">
            <div className="flex flex-col gap-4 text-slate-800">
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">
                １日摂取カロリー/たんぱく質 計算機
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                年齢・身長・体重・活動量から、1日に必要なおおよそのカロリーとタンパク質目安を算出します。
              </p>
            </div>

            <form className="mt-8 grid gap-6 sm:grid-cols-2">
              <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-semibold text-slate-700">性別</legend>
                <div className="flex gap-3">
                  {(
                    [
                      { label: "男性", value: "male" as const },
                      { label: "女性", value: "female" as const },
                    ]
                  ).map((option) => {
                    const isActive = gender === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGender(option.value)}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A23]/50 ${
                          isActive
                            ? "border-transparent bg-[#FF8A23] text-white shadow-lg"
                            : "border-[#FCD27B] bg-white text-[#C2410C] hover:border-[#FF8A23]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="weight">
                  体重 (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  inputMode="numeric"
                  value={weightInput}
                  min={WEIGHT_MIN}
                  max={WEIGHT_MAX}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "" || /^\d*$/.test(value)) {
                      setWeightInput(value);
                    }
                  }}
                  onBlur={() => {
                    const numeric = clampNumber(
                      parseInput(weightInput, DEFAULT_WEIGHT),
                      WEIGHT_MIN,
                      WEIGHT_MAX
                    );
                    setWeightInput(String(Math.round(numeric)));
                  }}
                  className="rounded-xl border border-[#FCD27B] bg-white px-4 py-3 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                />
                <p className="text-xs text-slate-500">推奨範囲: 30〜200kg</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="height">
                  身長 (cm)
                </label>
                <input
                  id="height"
                  type="number"
                  inputMode="numeric"
                  value={heightInput}
                  min={HEIGHT_MIN}
                  max={HEIGHT_MAX}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "" || /^\d*$/.test(value)) {
                      setHeightInput(value);
                    }
                  }}
                  onBlur={() => {
                    const numeric = clampNumber(
                      parseInput(heightInput, DEFAULT_HEIGHT),
                      HEIGHT_MIN,
                      HEIGHT_MAX
                    );
                    setHeightInput(String(Math.round(numeric)));
                  }}
                  className="rounded-xl border border-[#FCD27B] bg-white px-4 py-3 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                />
                <p className="text-xs text-slate-500">推奨範囲: 140〜220cm</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="age">
                  年齢
                </label>
                <input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  value={ageInput}
                  min={AGE_MIN}
                  max={AGE_MAX}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "" || /^\d*$/.test(value)) {
                      setAgeInput(value);
                    }
                  }}
                  onBlur={() => {
                    const numeric = clampNumber(
                      parseInput(ageInput, DEFAULT_AGE),
                      AGE_MIN,
                      AGE_MAX
                    );
                    setAgeInput(String(Math.round(numeric)));
                  }}
                  className="rounded-xl border border-[#FCD27B] bg-white px-4 py-3 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                />
                <p className="text-xs text-slate-500">推奨範囲: 15〜80歳</p>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="activity">
                  活動量
                </label>
                <select
                  id="activity"
                  value={activity.value}
                  onChange={(event) => {
                    const selected = activityOptions.find((option) => option.value === event.target.value);
                    if (selected) {
                      setActivity(selected);
                    }
                  }}
                  className="rounded-xl border border-[#FCD27B] bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                >
                  {activityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/50 bg-[#FFF7EB]/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-[#7C2D12]">推定1日の必要カロリー</h2>
              <div className="mt-6 grid gap-4">
                {[
                  {
                    label: "減量期（-10%目安）",
                    value: results.calorieTargets.cut,
                  },
                  {
                    label: "現状維持",
                    value: results.calorieTargets.maintain,
                  },
                  {
                    label: "増量期（+10%目安）",
                    value: results.calorieTargets.bulk,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/80 px-4 py-5 text-center shadow-inner sm:flex sm:items-center sm:justify-between"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#7C2D12]">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-[#C2410C] sm:mt-0">
                      {formatNumber(item.value)}
                      <span className="ml-1 text-sm font-semibold text-[#A16207]">kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/50 bg-[#FFF7EB]/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-[#7C2D12]">推定1日の必要たんぱく質</h2>
              <p className="mt-4 text-4xl font-bold text-[#C2410C]">
                {formatNumber(results.proteinTarget)}
                <span className="ml-1 text-lg font-semibold text-[#A16207]">g</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                3食に分けると1食あたり約{formatNumber(results.proteinPerMeal)}gが目安です。
                プロテインや高たんぱく食材を組み合わせてバランスよく摂取しましょう。
              </p>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

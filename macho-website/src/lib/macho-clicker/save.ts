export const MACHO_CLICKER_SAVE_VERSION = 2;

const LEGACY_SYSTEM_KEYS = [
  "dailyTrainingPlanId",
  "dailyTrainingDate",
  "dailySupplementIds",
  "dailySupplementDate",
  "dailyConditionId",
  "dailyConditionDate",
  "muscleCrystals",
  "crystalResearch",
  "buildingLevels",
] as const;

type SaveRecord = Record<string, unknown>;

export type PreviousVersionSnapshot = {
  sourceVersion: number;
  systems: SaveRecord;
};

export type MachoClickerSaveEnvelope<T extends SaveRecord> = T & {
  saveVersion: typeof MACHO_CLICKER_SAVE_VERSION;
  previousVersionSnapshot?: PreviousVersionSnapshot;
};

const isSaveRecord = (value: unknown): value is SaveRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getSourceVersion = (save: SaveRecord) =>
  typeof save.saveVersion === "number" && Number.isFinite(save.saveVersion)
    ? Math.max(1, Math.floor(save.saveVersion))
    : 1;

const createPreviousVersionSnapshot = (save: SaveRecord, sourceVersion: number) => {
  const systems = Object.fromEntries(
    LEGACY_SYSTEM_KEYS.flatMap((key) => (key in save ? [[key, save[key]]] : []))
  );

  return Object.keys(systems).length > 0
    ? {
        sourceVersion,
        systems,
      }
    : undefined;
};

export const migrateMachoClickerSave = (value: unknown): SaveRecord => {
  if (!isSaveRecord(value)) {
    throw new TypeError("セーブデータの形式が正しくありません。");
  }

  const sourceVersion = getSourceVersion(value);
  if (sourceVersion > MACHO_CLICKER_SAVE_VERSION) {
    throw new RangeError("このセーブデータは新しいバージョンで作成されています。");
  }

  if (sourceVersion === MACHO_CLICKER_SAVE_VERSION) {
    return value;
  }

  return {
    ...value,
    saveVersion: MACHO_CLICKER_SAVE_VERSION,
    previousVersionSnapshot:
      value.previousVersionSnapshot ?? createPreviousVersionSnapshot(value, sourceVersion),
  };
};

export const createMachoClickerSave = <T extends SaveRecord>(
  state: T
): MachoClickerSaveEnvelope<T> => ({
  ...state,
  saveVersion: MACHO_CLICKER_SAVE_VERSION,
});

export const serializeMachoClickerSave = <T extends SaveRecord>(state: T) =>
  JSON.stringify(createMachoClickerSave(state));

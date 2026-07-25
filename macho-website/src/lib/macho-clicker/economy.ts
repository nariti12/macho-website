export type PurchasableBuilding = {
  baseCost: number;
  costRate: number;
};

export type PurchaseAmount = 1 | 10 | 100 | "max";

export type BulkPurchase = {
  quantity: number;
  cost: number;
};

export type ProductionMultipliers = {
  prestige?: number;
  legacy?: number;
  frenzy?: number;
  powerUpgrades?: number;
};

export type ProductionBreakdown = {
  basePerSecond: number;
  multipliers: Required<ProductionMultipliers>;
  finalPerSecond: number;
};

const MAX_PURCHASE_QUANTITY = 10_000;
const MAX_SAFE_GAME_NUMBER = 1e300;

const clampGameNumber = (value: number) =>
  Number.isFinite(value) ? Math.min(MAX_SAFE_GAME_NUMBER, Math.max(0, value)) : MAX_SAFE_GAME_NUMBER;

export const getBuildingCost = (building: PurchasableBuilding, owned: number) =>
  Math.ceil(building.baseCost * building.costRate ** Math.max(0, owned));

export const getBulkBuildingCost = (
  building: PurchasableBuilding,
  owned: number,
  quantity: number
) => {
  let cost = 0;
  const normalizedQuantity = Math.max(0, Math.floor(quantity));

  for (let index = 0; index < normalizedQuantity; index += 1) {
    cost = clampGameNumber(cost + getBuildingCost(building, owned + index));
  }

  return cost;
};

export const getMaxAffordableBuildingCount = (
  building: PurchasableBuilding,
  owned: number,
  available: number
) => {
  let cost = 0;
  let quantity = 0;
  const normalizedAvailable = clampGameNumber(available);

  while (quantity < MAX_PURCHASE_QUANTITY) {
    const nextCost = getBuildingCost(building, owned + quantity);
    if (cost + nextCost > normalizedAvailable) break;
    cost = clampGameNumber(cost + nextCost);
    quantity += 1;
  }

  return { quantity, cost };
};

export const getBulkPurchase = (
  building: PurchasableBuilding,
  owned: number,
  available: number,
  amount: PurchaseAmount
): BulkPurchase => {
  if (amount === "max") {
    return getMaxAffordableBuildingCount(building, owned, available);
  }

  return {
    quantity: amount,
    cost: getBulkBuildingCost(building, owned, amount),
  };
};

export const calculateProduction = (
  basePerSecond: number,
  multipliers: ProductionMultipliers = {}
): ProductionBreakdown => {
  const normalizedMultipliers = {
    prestige: multipliers.prestige ?? 1,
    legacy: multipliers.legacy ?? 1,
    frenzy: multipliers.frenzy ?? 1,
    powerUpgrades: multipliers.powerUpgrades ?? 1,
  };
  const finalPerSecond = Object.values(normalizedMultipliers).reduce(
    (production, multiplier) => production * Math.max(0, multiplier),
    Math.max(0, basePerSecond)
  );

  return {
    basePerSecond: Math.max(0, basePerSecond),
    multipliers: normalizedMultipliers,
    finalPerSecond: clampGameNumber(finalPerSecond),
  };
};

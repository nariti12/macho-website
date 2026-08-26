import manifest from "../../../public/images/characters/macho-face2/v1/manifest.json";

export const MACHO_CHARACTER_WIDTH = 768;
export const MACHO_CHARACTER_HEIGHT = 1230;
export const MACHO_CHARACTER_STAGES = manifest.stages.map((stage) => ({
  level: stage.level,
  imageSrc: `/images/characters/${manifest.packageId}/v1/${stage.deliveryWebp.split("/").at(-1)}`,
}));

// Intermediate numeric levels use the nearest approved asset at or below them.
export const getMachoCharacterAsset = (level: number) =>
  MACHO_CHARACTER_STAGES.reduce(
    (current, stage) => (stage.level <= level ? stage : current),
    MACHO_CHARACTER_STAGES[0],
  );

export const MACHO_HERO_IMAGE = getMachoCharacterAsset(manifest.character.websiteHeroLevel).imageSrc;

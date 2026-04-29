export type HighProteinFood = {
  name: string;
  category: string;
  imageUrl: string;
  protein: number;
  calories: number;
  fat: number;
  carbs: number;
};

export const highProteinFoods: HighProteinFood[] = [
  {
    name: "たんぱく質が摂れるチキン＆チリ",
    category: "セブンイレブン",
    imageUrl: "https://img-afd.7api-01.dp1.sej.co.jp/item-image/053705/8F74770DD0424CAD3F00F4BF85612B6A.jpg",
    protein: 24.1,
    calories: 261,
    fat: 8.8,
    carbs: 23.3,
  },
];

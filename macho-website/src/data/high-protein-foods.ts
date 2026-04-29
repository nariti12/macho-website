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
  {
    name: "鰆の西京焼き 菜の花からし和え添え",
    category: "大戸屋",
    imageUrl: "https://www.ootoya.com/files/menu_img/1250.jpg?id=3860",
    protein: 40.5,
    calories: 699,
    fat: 17.8,
    carbs: 94.5,
  },
  {
    name: "鶏そぼろたまご丼",
    category: "松屋",
    imageUrl: "https://www.matsuyafoods.co.jp/menu/upload_images/don_soboro_tamago_hp_250930.jpg",
    protein: 19.6,
    calories: 430,
    fat: 9.2,
    carbs: 63.4,
  },
];

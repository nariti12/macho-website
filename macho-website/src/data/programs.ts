export type Gender = "male" | "female";
export type TrainType = "gym" | "home";
export type Freq = "1-2" | "3" | "4" | "5" | "6" | "7";

export interface ProgramDayItem {
  name: string;
  reps: string;
  note?: string;
}

export interface ProgramDay {
  title: string;
  items: ProgramDayItem[];
}

export interface ProgramDetail {
  title: string;
  intro: string[];
  days: ProgramDay[];
  principles: string[];
}

export type ProgramValue = ProgramDetail | "coming_soon";

export interface ProgramMap {
  [gender: string]: {
    [type: string]: {
      [freq: string]: ProgramValue;
    };
  };
}

const femaleGymOneTwoProgram: ProgramDetail = {
  title: "ジム週１～２回最強筋トレメニュー",
  intro: [
    "このトレーニングメニューは「美尻・くびれ・姿勢改善」といった美しいボディラインを目指す女性向けに設計しています。",
    "筋トレで土台を作り、有酸素で余分な脂肪を燃やすことで、週1,2回のトレーニングでもこのメニューでより健康的でしなやかな体を目指せます。",
  ],
  days: [
    {
      title: "お好きな曜日でOK",
      items: [
        { name: "ヒップスラスト(スミスマシン)", reps: "10回 × 3セット" },
        { name: "レッグプレス", reps: "10回 × 3セット" },
        { name: "ラットプルダウン", reps: "10回 × 3セット" },
        { name: "チェストプレス", reps: "12回 × 2セット" },
        { name: "ロータリートルソー", reps: "左右10回ずつ × 2セット" },
        { name: "傾斜ウォーキング(傾斜5〜10％)", reps: "20〜30分" },
      ],
    },
  ],
  principles: [
    "ヒップ・脚・背中・胸をバランス良く鍛えつつ、体幹と有酸素を組み合わせることで効率的に引き締めを狙います。",
    "高重量すぎない負荷でフォームを意識し、女性らしいライン作りを優先するのがポイントです。",
  ],
};

const femaleGymThreeProgram: ProgramDetail = {
  title: "ジム週3回最強筋トレメニュー",
  intro: [
    "このトレーニングメニューは「美尻・くびれ・美しい姿勢」を手に入れるために最適化されたメニューです。",
    "筋トレでボディラインを作り、有酸素で余分な脂肪を落とすことで、しなやかで健康的な女性らしい体型を確実に目指せます。",
  ],
  days: [
    {
      title: "火曜日：下半身 ＋ 有酸素",
      items: [
        { name: "ヒップスラスト(スミスマシン)", reps: "10回 × 3セット" },
        { name: "レッグプレス", reps: "10回 × 3セット" },
        { name: "アブダクター", reps: "12回 × 3セット" },
        { name: "アダクター", reps: "12回 × 3セット" },
        { name: "傾斜ウォーキング(傾斜5〜10％)", reps: "20〜30分" },
      ],
    },
    {
      title: "木曜日：上半身 ＋ 有酸素",
      items: [
        { name: "ラットプルダウン", reps: "10回 × 3セット" },
        { name: "シーテッドロー(ケーブル)", reps: "10回 × 3セット" },
        { name: "チェストプレス", reps: "12回 × 2セット" },
        { name: "ロータリートルソー", reps: "左右10回ずつ × 2セット" },
        { name: "バイク", reps: "20分" },
      ],
    },
    {
      title: "土曜日：全身バランス ＋ 有酸素",
      items: [
        { name: "ブルガリアンスクワット", reps: "10回 × 3セット" },
        { name: "ダンベルショルダープレス", reps: "10回 × 3セット" },
        { name: "サイドレイズ", reps: "15回 × 3セット" },
        { name: "クランチマシン", reps: "10回 × 3セット" },
        { name: "傾斜ウォーキング(傾斜5〜10％)", reps: "20〜30分" },
      ],
    },
  ],
  principles: [
    "下半身・上半身・全身の3分割で、美尻・美脚・くびれ・姿勢改善を効率よく作る構成です。",
    "各回の最後に有酸素を入れることで脂肪燃焼を高め、筋トレで作ったラインをより際立たせます。",
  ],
};

const femaleHomeBodyweightProgram: ProgramDetail = {
  title: "家トレ（自重）最強筋トレメニュー",
  intro: [
    "器具は最小限でOK。自宅で取り組める、女性らしいボディラインを作るために最適化された現実的なトレーニングメニューです。",
    "筋トレでラインを整え、有酸素で余分な脂肪を燃焼させることで「美尻・くびれ」をしっかり目指します。",
  ],
  days: [
    {
      title: "お好きな曜日でOK",
      items: [
        { name: "ヒップリフト", reps: "15回 × 3セット" },
        { name: "ブルガリアンスクワット（椅子使用）", reps: "左右10回 × 3セット" },
        { name: "膝コロ(腹筋ローラー)", reps: "10回 × 3セット" },
        { name: "サイドプランク", reps: "左右30秒 × 2セット" },
        { name: "プッシュアップ(プッシュアップバー) ※膝つき可", reps: "10回 × 3セット" },
        { name: "有酸素(youtubeで「女性 家 有酸素」で検索してお好きなのを選んでください)", reps: "10分" },
      ],
    },
  ],
  principles: [
    "週2日以上を目安に継続することで、確実に体のラインが変わっていきます。",
    "大切なのは無理をせず「続けること」。継続こそが美しいボディラインを作る最大の武器です。",
  ],
};


const maleHomeBodyweightProgram: ProgramDetail = {
  title: "家トレ（自重）最強筋トレメニュー",
  intro: [
    "場所や時間も気にせず、自由にトレーニングできるのが家トレの最大のメリットです。",
  ],
  days: [
    {
      title: "全身サーキット（週3日以上実施）",
      items: [
        { name: "プッシュアップ(プッシュアップバー)", reps: "15回 × 5セット" },
        { name: "チンニング(懸垂バー)", reps: "9回 × 3セット" },
        { name: "ディップス(ディップススタンド)", reps: "12回 × 3セット" },
        { name: "ブルガリアンスクワット(ディップススタンド)", reps: "9回 × 3セット" },
        { name: "膝コロ or できれば立ちコロ(腹筋ローラー)", reps: "10回 × 3セット" },
      ],
    },
  ],
  principles: [
    "このメニューで週3日以上トレーニングできると、かなり身体がバキバキになれます。",
    "プッシュアップバーや懸垂バーなど最低限のトレーニング器具は用意してください。",
    "床を傷つけないためにぷにぷにマットも購入しておきましょう。１万～２万円位で全て揃えられると思います。",
  ],
};

export const programs: ProgramMap = {
  male: {
    gym: {
      "1-2": {
        title: "ジム週１～２回最強筋トレメニュー",
        intro: [
          "週1～2回の頻度で筋トレをするのであれば、「全身法」で筋トレをすることが最も効率よく筋肉を発達させることができます。",
          "スケジュール調整も柔軟に対応できますし、限られた時間の中でも、最大限に身体を鍛えることができます。",
        ],
        days: [
          {
            title: "お好きな曜日でOK",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "チンニング(懸垂)", reps: "9回 × 3 set" },
              { name: "レッグプレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
        ],
        principles: [
          "大きな筋肉から小さな筋肉の順番に鍛えるのが鉄則ですので、メニューの上から順番に実施していくのがポイントです。",
          "全身を満遍なく鍛えていきます。",
        ],
      },
      "3": {
        title: "ジム週３回最強筋トレメニュー",
        intro: [
          "筋肉の大きい部位ごとに分割法でメニューを組みます。曜日は参考ですので、お好きな曜日をチョイスして下さい。",
          "こちらのメニューは、忙しいけど身体バキバキにされたい方におすすめです。",
        ],
        days: [
          {
            title: "火曜日：背中 ＋　三頭筋　＋　腹筋",
            items: [
              { name: "デッドリフト", reps: "9回 × 5 set" },
              { name: "ラットプルダウン", reps: "9回 × 3 set" },
              { name: "ケーブルロウ", reps: "12回 × 3 set" },
              { name: "トライセップエクステンション(EZバー)", reps: "9回 × 3 set" },
              { name: "腹筋ローラー", reps: "10回 × 3 set" },
            ],
          },
          {
            title: "木曜日：胸　＋　二頭筋　＋　腹筋",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "インクラインダンベルベンチプレス", reps: "9回 × 3 set" },
              { name: "マシンペックフライ", reps: "12回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
          {
            title: "土曜日：脚 + 肩",
            items: [
              { name: "スクワット", reps: "7回 × 5 set" },
              { name: "レッグエクステンション", reps: "9回 × 3 set" },
              { name: "レッグカール", reps: "9回 × 3 set" },
              { name: "ダンベルショルダープレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "ダンベルリアレイズ", reps: "15回 × 3 set" },
            ],
          },
        ],
        principles: [
          "週3はBIG3を主軸に、胸・背中・脚で全身を鍛えていきます。最初に高重量を扱って大きな筋肉を刺激させることで、効率良く筋肥大させていくことを狙っています。",
          "また、各筋肉の部位毎に上部・中部・下部をしっかり鍛えられるよう、それぞれ意識したベストな種目を取り入れています。",
          "腹筋種目は余裕があれば追加でやりましょう。",
        ],
      },
      "4": {
        title: "ジム週４回最強筋トレメニュー",
        intro: [
          "筋肉の主要な部位ごとに分割法でメニューを組みます。曜日は参考ですので、お好きに入れ替えてもOKです。",
          "週４だと詰め込みすぎることなく全身を鍛えらえるので、個人的におすすめな頻度です。",
        ],
        days: [
          {
            title: "火曜日：背中 + 腹筋",
            items: [
              { name: "デッドリフト", reps: "7回 × 5 set" },
              { name: "ラットプルダウン", reps: "9回 × 3 set" },
              { name: "ケーブルロウ", reps: "12回 × 3 set" },
              { name: "懸垂", reps: "9回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
          {
            title: "木曜日：胸　＋　二頭筋",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "インクラインダンベルベンチプレス", reps: "9回 × 3 set" },
              { name: "マシンペックフライ", reps: "12回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンマーカール", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "土曜日：脚",
            items: [
              { name: "スクワット", reps: "7回 × 5 set" },
              { name: "レッグプレス", reps: "10回 × 3 set" },
              { name: "レッグエクステンション", reps: "15回 × 3 set" },
              { name: "レッグカール", reps: "12回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "日曜日：肩　＋　三頭筋",
            items: [
              { name: "ダンベルショルダープレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "ダンベルリアレイズ", reps: "15回 × 3 set" },
              { name: "フロントレイズ", reps: "12回 × 3 set" },
              { name: "ケーブルプレスダウン", reps: "15回 × 3 set" },
            ],
          },
        ],
        principles: [
          "BIG3を軸に、高重量＋中重量＋パンプ系の三段構えで効率的に筋肥大を狙っていきます。",
          "また、各筋肉の部位毎に上部・中部・下部をしっかり鍛えられるよう、それぞれ意識したベストな種目を取り入れています。",
        ],
      },
      "5": {
        title: "ジム週５回最強筋トレメニュー",
        intro: [
          "筋肉の各部位ごとに分けて分割法でメニューを組みます。",
          "週5回は筋肉にとっては一番ベストに分割できる頻度になります。フィジークの大会を目指したい方はこちらがおすすめです。",
        ],
        days: [
          {
            title: "月曜日：背中＋二頭",
            items: [
              { name: "デッドリフト", reps: "7回 × 5 set" },
              { name: "ラットプルダウン", reps: "9回 × 3 set" },
              { name: "ケーブルロウ", reps: "12回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンマーカール", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "火曜日：胸 ＋ 三頭筋",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "インクラインダンベルベンチプレス", reps: "9回 × 3 set" },
              { name: "マシンペックフライ", reps: "12回 × 3 set" },
              { name: "ディップス（加重）", reps: "9回 × 3 set" },
              { name: "ケーブルプレスダウン", reps: "15回 × 3 set" },
            ],
          },
          {
            title: "木曜日：脚",
            items: [
              { name: "スクワット", reps: "7回 × 5 set" },
              { name: "レッグプレス", reps: "10回 × 3 set" },
              { name: "レッグエクステンション", reps: "15回 × 3 set" },
              { name: "レッグカール", reps: "12回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "土曜日：肩",
            items: [
              { name: "ダンベルショルダープレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "ダンベルリアレイズ", reps: "15回 × 3 set" },
              { name: "フェイスプル", reps: "20回 × 3 set" },
              { name: "フロントレイズ", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "日曜日：弱点補強 + 腹筋",
            items: [
              { name: "弱点部位1(例：ベンチプレス )", reps: "9回 × 5 set" },
              { name: "弱点部位2(例：ベントオーバーロウ)", reps: "9回 × 3 set" },
              { name: "弱点部位3(例：サイドレイズ)", reps: "20回 × 3 set" },
              { name: "腹筋ローラー", reps: "10回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
        ],
        principles: [
          "高重量＋中重量＋パンプ系を組み合わせて筋肥大効率を最大化。",
          "また、各筋肉の部位毎に満遍なく効かせられるよう最適な種目を組んでいます。",
        ],
      },
      "6": {
        title: "ジム週６回最強筋トレメニュー",
        intro: [
          "究極の身体を手に入れたい方はこちらがおすすめです。フィジークやボディビルなどの大会で優勝を目指しましょう。",
        ],
        days: [
          {
            title: "月曜日：胸 ＋ 三頭筋",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "インクラインダンベルベンチプレス", reps: "9回 × 3 set" },
              { name: "マシンペックフライ", reps: "12回 × 3 set" },
              { name: "ディップス（加重）", reps: "9回 × 3 set" },
              { name: "ケーブルプレスダウン", reps: "15回 × 3 set" },
            ],
          },
          {
            title: "火曜日：背中 + 二頭筋",
            items: [
              { name: "デッドリフト", reps: "7回 × 5 set" },
              { name: "ラットプルダウン", reps: "9回 × 3 set" },
              { name: "ケーブルロウ", reps: "12回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンマーカール", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "水曜日：脚(大腿四頭筋中心)",
            items: [
              { name: "スクワット", reps: "7回 × 5 set" },
              { name: "レッグプレス", reps: "10回 × 3 set" },
              { name: "レッグエクステンション", reps: "15回 × 3 set" },
              { name: "レッグカール", reps: "12回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "木曜日：肩",
            items: [
              { name: "ダンベルショルダープレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "ダンベルリアレイズ", reps: "15回 × 3 set" },
              { name: "フェイスプル", reps: "20回 × 3 set" },
              { name: "フロントレイズ", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "土曜日：脚(ハム中心)",
            items: [
              { name: "ルーマニアンデッドリフト", reps: "9回 × 5 set" },
              { name: "グッドモーニング", reps: "12回 × 3 set" },
              { name: "レッグカール", reps: "15回 × 3 set" },
              { name: "ヒップスラスト", reps: "9回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "日曜日：弱点補強 + 腹筋",
            items: [
              { name: "弱点部位1(例：ベンチプレス )", reps: "9回 × 5 set" },
              { name: "弱点部位2(例：ベントオーバーロウ)", reps: "9回 × 3 set" },
              { name: "弱点部位3(例：サイドレイズ)", reps: "20回 × 3 set" },
              { name: "腹筋ローラー", reps: "10回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
        ],
        principles: [
          "脚と肩を週2回に分けて鍛え、全身のバランスとアウトラインを最大化するのがポイントです。",
          "重い日とパンプ狙いの日を組み合わせて強度に変化をつけ、弱点補強と有酸素も加えることで仕上げていきます。",
        ],
      },
      "7": {
        title: "ジム週７回最強筋トレメニュー",
        intro: [
          "週7回はプロになります。天下を取りましょう。",
          "言うまでもないですが、初心者の方はこちらのメニューで組まないで下さい。身体壊しますので。",
        ],
        days: [
          {
            title: "月曜日：胸 ＋ 三頭筋",
            items: [
              { name: "ベンチプレス", reps: "9回 × 5 set" },
              { name: "インクラインダンベルベンチプレス", reps: "9回 × 3 set" },
              { name: "マシンペックフライ", reps: "12回 × 3 set" },
              { name: "ディップス（加重）", reps: "9回 × 3 set" },
              { name: "ケーブルプレスダウン", reps: "15回 × 3 set" },
            ],
          },
          {
            title: "火曜日：背中 + 二頭筋",
            items: [
              { name: "デッドリフト", reps: "7回 × 5 set" },
              { name: "ラットプルダウン", reps: "9回 × 3 set" },
              { name: "ケーブルロウ", reps: "12回 × 3 set" },
              { name: "インクラインダンベルカール", reps: "12回 × 3 set" },
              { name: "ハンマーカール", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "水曜日：脚(大腿四頭筋中心)",
            items: [
              { name: "スクワット", reps: "7回 × 5 set" },
              { name: "レッグプレス", reps: "10回 × 3 set" },
              { name: "レッグエクステンション", reps: "15回 × 3 set" },
              { name: "レッグカール", reps: "12回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "木曜日：肩 + 胸（軽め）",
            items: [
              { name: "ダンベルショルダープレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "ダンベルリアレイズ", reps: "15回 × 3 set" },
              { name: "フェイスプル", reps: "20回 × 3 set" },
              { name: "ダンベルプルオーバー", reps: "12回 × 3 set" },
            ],
          },
          {
            title: "金曜日：弱点補強 + 腹筋",
            items: [
              { name: "弱点部位1(例：ベンチプレス )", reps: "9回 × 5 set" },
              { name: "弱点部位2(例：ベントオーバーロウ)", reps: "9回 × 3 set" },
              { name: "弱点部位3(例：サイドレイズ)", reps: "20回 × 3 set" },
              { name: "腹筋ローラー", reps: "10回 × 3 set" },
              { name: "ハンギングレッグレイズ", reps: "10回 × 3 set" },
            ],
          },
          {
            title: "土曜日：脚(ハム中心)",
            items: [
              { name: "ルーマニアンデッドリフト", reps: "9回 × 5 set" },
              { name: "グッドモーニング", reps: "12回 × 3 set" },
              { name: "レッグカール", reps: "15回 × 3 set" },
              { name: "ヒップスラスト", reps: "9回 × 3 set" },
              { name: "カーフレイズ", reps: "20回 × 3 set" },
            ],
          },
          {
            title: "日曜日：肩 + 弱点補強",
            items: [
              { name: "オーバーヘッドプレス", reps: "9回 × 3 set" },
              { name: "ダンベルサイドレイズ", reps: "20回 × 3 set" },
              { name: "フロントレイズ", reps: "12回 × 3 set" },
              { name: "リアデルト", reps: "12回 × 3 set" },
              { name: "弱点部位を1種目", reps: "任意" },
            ],
          },
        ],
        principles: [
          "脚と肩を週2回ずつ鍛えることでアウトラインとバランスを最強に。",
          "さらに弱点部位の補強もしっかり行うことで、大会で評価されるVシェイプとバランスを確実に仕上げていきます。",
        ],
      },
    },
    home: {
      "1-2": maleHomeBodyweightProgram,
      "3": maleHomeBodyweightProgram,
      "4": maleHomeBodyweightProgram,
      "5": maleHomeBodyweightProgram,
      "6": maleHomeBodyweightProgram,
      "7": maleHomeBodyweightProgram,
    },
  },
  female: {
    gym: {
      "1-2": femaleGymOneTwoProgram,
      "3": femaleGymThreeProgram,
    },
    home: {
      "1-2": femaleHomeBodyweightProgram,
      "3": femaleHomeBodyweightProgram,
      "4": femaleHomeBodyweightProgram,
      "5": femaleHomeBodyweightProgram,
      "6": femaleHomeBodyweightProgram,
      "7": femaleHomeBodyweightProgram,
    },
  },
};

export const isValidGender = (value: string | null): value is Gender =>
  value === "male" || value === "female";

export const isValidTrainType = (value: string | null): value is TrainType =>
  value === "gym" || value === "home";

export const isValidFreq = (value: string | null): value is Freq =>
  value === "1-2" || value === "3" || value === "4" || value === "5" || value === "6" || value === "7";

export const getProgramValue = (
  gender: Gender | null,
  type: TrainType | null,
  freq: Freq | null,
): ProgramValue | null => {
  if (!gender || !type) return null;
  const byGender = programs[gender];
  if (!byGender) return null;
  const byType = byGender[type];
  if (!byType) return null;
  if (type === "home") {
    const availableKeys = Object.keys(byType);
    if (availableKeys.length === 0) return null;
    const targetKey = freq && byType[freq] ? freq : (availableKeys[0] as Freq);
    return byType[targetKey] ?? null;
  }
  if (!freq) return null;
  return byType[freq] ?? null;
};

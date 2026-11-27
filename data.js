// 実験器具あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、香川県教育委員会の補充プリント・横浜市立境木中学校の学習課題・宮城県総合教育センターの授業案・大阪市立中学校のドリルプリント・埴生中学校の理科基礎シート（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、使い方の説明を読んで、ガスバーナーの部品（ガス調節ねじ・空気調節ねじ・元栓）か器具（メスシリンダー・上皿てんびん）を選ぶ。正解したら2段目「何をするもの？」を選ぶ。
// 顕微鏡は「顕微鏡の部品あて」で扱う。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    kagawa: ["香川県教育委員会 中学1年理科 補充プリント「ガスバーナーの使い方」", "https://www.pref.kagawa.lg.jp/documents/14703/j1_ri_ho_02.pdf"],
    yokohama: ["横浜市立境木中学校 1年理科 学習課題「ガスバーナーの使い方」", "https://www.edu.city.yokohama.jp/school/jhs/sakaigi/index.cfm/1,2086,c,html/2086/20200515-141905.pdf"],
    miyagi: ["宮城県総合教育センター 授業支援「メスシリンダー」", "https://www.edu-c.pref.miyagi.jp/midori/science/jugyo-sien/jugyouan/2015/jugyouan/1_09measuringcylinder.pdf"],
    osaka: ["大阪市立中学校 ドリルプリント 中学1年理科「身のまわりの物質とその性質」", "https://swa.city-osaka.ed.jp/j722634/download/document/15609422"],
    habu: ["埴生中学校 理科基礎シート 中1「物質のすがた」", "https://habu-j.esnet.ed.jp/file/114"],
  };

  // 答えになる5つ
  const CLASSES = ["ガス調節ねじ", "空気調節ねじ", "元栓", "メスシリンダー", "上皿てんびん"];

  // 2段目「何をするもの？」の3つ
  const GROUPS = {
    hono: { name: "炎を調節する", sub: "ガスバーナーのねじ" },
    gas: { name: "ガスを出す・止める", sub: "ガスのもとを開け閉めする" },
    hakaru: { name: "はかる", sub: "体積や質量をはかる" },
  };
  // 何を変える・はかる（「なぜ」に出す）
  const CATS = { gasryo: "ガスの量", kuuki: "空気の量", moto: "ガスのもと", taiseki: "液体の体積", shitsuryo: "質量" };
  // 答えごとの決まり。2段目・何を・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "ガス調節ねじ": { grp: "hono", cat: "gasryo", key: "ガス調節ねじは、ガスの量を調節して炎の大きさを変えるねじです。" },
    "空気調節ねじ": { grp: "hono", cat: "kuuki", key: "空気調節ねじは、空気の量を調節して青い炎にするねじです。" },
    "元栓": { grp: "gas", cat: "moto", key: "元栓は、火をつけるときに初めに開き、火を消したあと最後に閉じます。" },
    "メスシリンダー": { grp: "hakaru", cat: "taiseki", key: "メスシリンダーは、水平な所に置き、液面の平らな所を目の高さで読んで体積をはかります。" },
    "上皿てんびん": { grp: "hakaru", cat: "shitsuryo", key: "上皿てんびんは、針が左右に均等にふれるようにつり合わせて質量をはかります。" },
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["理科の実験で。", "プリントの問題。", "実験ノートより。", "テスト勉強で。", "理科の授業で。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どれ？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("g_ookisa", 0, "ガス調節ねじ", "炎の大きさ", ["yokohama"], "ガスの量を変えるねじです。",
      "横浜市の学習課題では、ガス調節ねじを回してガスの量を調節し、炎の大きさを10cmくらいにします。",
      ["ガスの量を調節して、炎の大きさを変えるねじ。"]),
    K("k_aoi", 0, "空気調節ねじ", "青い炎にする", ["yokohama"], "空気の量を変えるねじです。",
      "横浜市の学習課題では、ガス調節ねじを動かさないようにして空気調節ねじをゆるめ、空気の量を調節して青い炎にします。",
      ["空気の量を調節して、青い炎にするねじ。"]),
    K("m_hajime", 0, "元栓", "初めに開く", ["osaka", "habu"], "ガスのもとにあります。",
      "大阪市のドリルプリントや埴生中学校の理科基礎シートでは、2つのねじがしまっているかを確かめたあと、ガスの元栓を開きます。",
      ["火をつけるとき、2つのねじがしまっているかを確かめたあと、初めに開くもの。"]),
    K("c_taiseki", 0, "メスシリンダー", "液体の体積", ["miyagi"], "目盛りを読む器具です。",
      "宮城県総合教育センターの授業案では、メスシリンダーで液体をはかりとったり、液面の差から体積を求めたりします。",
      ["目盛りを読んで、液体の体積をはかる器具。"]),
    K("t_yakuhoshi", 0, "上皿てんびん", "薬包紙をのせる", ["osaka"], "質量をはかる器具です。",
      "大阪市のドリルプリントでは、上皿てんびんで薬品をはかるとき、両方の皿に薬包紙をのせます。",
      ["質量をはかる器具で、薬品をはかるときは両方の皿に薬包紙をのせるもの。"]),
    // ---- ふつう ----
    K("g_tenka", 1, "ガス調節ねじ", "ゆるめて火をつける", ["yokohama", "osaka"], "ガスを出すねじです。",
      "横浜市の学習課題では、ななめ下からマッチの火を近づけ、ガス調節ねじをゆるめてガスに火をつけます。",
      ["ななめ下からマッチの火を近づけてから、ゆるめてガスに火をつけるねじ。"]),
    K("k_akai", 1, "空気調節ねじ", "炎が赤いとき", ["osaka"], "空気が足りないときに開きます。",
      "大阪市のドリルプリントでは、炎が赤いのは空気の量が不足している場合なので、空気調節ねじを開きます。",
      ["炎が赤くなっているとき、空気が足りないので開くねじ。"]),
    K("m_saigo", 1, "元栓", "最後に閉じる", ["yokohama", "kagawa"], "火を消すときの順番を思い出しましょう。",
      "火を消すときは、空気調節ねじ→ガス調節ねじ→コック→元栓の順に閉じます（横浜市の学習課題・香川県のプリント）。",
      ["火を消すとき、いちばん最後に閉じるもの。"]),
    K("c_mesen", 1, "メスシリンダー", "目の高さで液面を読む", ["miyagi", "osaka"], "液面を読みます。",
      "目の高さを液面に水平にして、液面の下の平らな所を読み取ります（宮城県総合教育センター）。水平なところに置きます（大阪市のドリルプリント）。",
      ["水平な所に置き、目の高さを液面に水平にして、液面の平らな所を読み取る器具。"]),
    K("t_fundo", 1, "上皿てんびん", "大きい分銅から", ["osaka"], "分銅を使う器具です。",
      "大阪市のドリルプリントでは、質量の大きい分銅をのせ、大きすぎたら次に大きい分銅ととりかえていきます。",
      ["質量の大きい分銅からのせ、大きすぎたら次に大きい分銅ととりかえる器具。"]),
    // ---- むずかしい ----
    K("g_inka", 2, "ガス調節ねじ", "先に開くと引火", ["kagawa"], "点火の順番に注意するねじです。",
      "点火するとき、ガス調節ねじを開いた後でマッチに火を付けないこと。ガスが出て、広がったガスに引火してしまうためです（香川県のプリント）。",
      ["点火の前に開いてからマッチに火をつけると、広がったガスに引火してしまうねじ。"]),
    K("k_kesu", 2, "空気調節ねじ", "消すとき初めに閉める", ["yokohama", "kagawa"], "火を消す順番を思い出しましょう。",
      "火を消すときは、まず空気調節ねじを閉めて空気を止め、次にガス調節ねじを閉めます（横浜市の学習課題・香川県のプリント）。",
      ["火を消すとき、いちばん初めに閉めるねじ。"]),
    K("m_kieta", 2, "元栓", "火が消えたらすぐ閉じる", ["yokohama"], "コックといっしょに閉じます。",
      "横浜市の学習課題では、空気を入れすぎて火が消えたら、すぐに元栓とコックを閉じます。",
      ["空気を入れすぎて火が消えたら、コックといっしょにすぐ閉じるもの。"]),
    K("c_juubun", 2, "メスシリンダー", "10分の1まで読む", ["miyagi"], "目分量で読みます。",
      "宮城県総合教育センターの授業案では、最小目盛りの10分の1まで目分量で読み、液面の差から固体の体積を求めます。",
      ["最小目盛りの10分の1まで目分量で読み、液面の差から固体の体積を求める器具。"]),
    K("t_hari", 2, "上皿てんびん", "針が左右に均等", ["osaka"], "針が止まるまで待たなくてよい器具です。",
      "大阪市のドリルプリントでは、針が左右に均等にふれているとき、つり合っていると判断します。針が止まるまで待たなくてもよいです。",
      ["針が左右に均等にふれているとき、つり合っていると判断する器具。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "g_ookisa|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit 2026-11-17）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const JKG = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = JKG; else root.JKG = JKG;
})(typeof self !== "undefined" ? self : this);

# Multilingual

한 단락 안에 섞인 여러 문자세트를 글자별로 골라내, 각 segment를 `<span lang … data-script … class="ml-…">`로 감싸 CSS로 따로 스타일링할 수 있게 해 주는 작은 라이브러리.

A tiny JavaScript library that splits mixed-script text into `<span>`s so each writing system can be styled independently in CSS.

- **Zero dependencies** · 의존성 없음
- **10 scripts** · Latin, 한글, 가나, 한자, 아랍, 키릴, 그리스, 히브리, 태국, 데바나가리
- **Modern detection** · `\p{Script=...}` Unicode property escapes
- **Explicit init** · 명시적 호출 전에는 아무것도 안 함
- **~270 lines, MIT**

## 왜 필요한가 · Why

한글 본문 폰트로 영문이나 숫자를 그리면 보통 보기가 좋지 않습니다. 영문에는 따로 영문 폰트(*Inter*, *Helvetica* 등)를 적용하고 싶지만, 한글 폰트와 영문 폰트는 메트릭(x-height, baseline, advance width)이 달라서 같은 `font-size`로 섞으면 균형이 깨집니다. 그렇다고 CSS의 `font-family`는 요소 단위로 적용되니, 한 `<p>` 안에 섞인 한글과 영문을 따로 타깃팅할 수 없습니다.

Multilingual은 문자 단위로 스크립트를 감지해 각 segment를 `<span>`으로 감싸 줍니다. 그러면 `.ml-en`, `.ml-ko`에 각각 다른 font-family, size, line-height, baseline을 줄 수 있고, 아랍어처럼 RTL인 스크립트는 `direction: rtl`도 따로 줄 수 있습니다.

> Korean body fonts usually render Latin letters and digits poorly, so designers want a dedicated Latin face for those parts. But Latin and Korean fonts have different metrics, so mixing them at a single `font-size` looks unbalanced — and CSS's `font-family` applies per element, so there's no way to target the Latin parts inside a paragraph that also contains Korean. Multilingual wraps each detected script run in its own `<span>` so you can target each one in CSS.

## 빠른 시작 · Quick start

```html
<script src="multilingual.js"></script>
<script>
  Multilingual.init({ autoInit: true, selector: '#content' });
</script>
```

```css
.ml-ko { font-family: 'Noto Sans KR', sans-serif; }
.ml-en { font-family: 'Inter', sans-serif; font-size: 0.95em; }
.ml-ar { font-family: 'Noto Naskh Arabic', serif; direction: rtl; }
```

## 사용 방법 · API

```js
// 1) init() — 페이지 로드 시 자동 wrap
Multilingual.init({ autoInit: true, selector: '#content' /*, ...config */ });

// 2) wrap() — 일회성 호출
Multilingual.wrap('#article', { /* per-call config */ });

// 3) instance — 같은 설정을 여러 요소에 재사용
const ml = new Multilingual({ /* config */ });
ml.wrap('#article');
ml.wrap('#sidebar');
```

## 출력 · Output

**Input**
```html
<p>Hello 안녕하세요 こんにちは 你好 مرحبا</p>
```

**Output**
```html
<p>
  <span lang="en" data-script="latin" class="ml-en">Hello </span>
  <span lang="ko" data-script="korean" class="ml-ko">안녕하세요 </span>
  <span lang="ja" data-script="japanese" class="ml-ja">こんにちは </span>
  <span lang="zh" data-script="chinese" class="ml-zh">你好 </span>
  <span lang="ar" data-script="arabic" class="ml-ar">مرحبا</span>
</p>
```

## 지원하는 문자세트 · Supported scripts

| Script | `data-script` | `lang` | Class |
|---|---|---|---|
| Latin (영문 등) | `latin` | `en` | `ml-en` |
| Korean · 한글 | `korean` | `ko` | `ml-ko` |
| Japanese kana · 가나 | `japanese` | `ja` | `ml-ja` |
| Chinese · 한자 | `chinese` | `zh` | `ml-zh` |
| Arabic · 아랍어 | `arabic` | `ar` | `ml-ar` |
| Cyrillic · 키릴 | `cyrillic` | `ru` | `ml-ru` |
| Greek · 그리스 | `greek` | `el` | `ml-el` |
| Hebrew · 히브리 | `hebrew` | `he` | `ml-he` |
| Thai · 태국 | `thai` | `th` | `ml-th` |
| Devanagari · 데바나가리 | `devanagari` | `hi` | `ml-hi` |

공백·문장부호·숫자는 기본적으로 주변 스크립트에 흡수됩니다. 옵션으로 분리하면 다음 카테고리를 받습니다:

> Spaces, punctuation, and digits inherit the surrounding script by default. Turn on the corresponding `separate*` flag to give them their own category:

| Category | Option | `data-script` | Class |
|---|---|---|---|
| Whitespace · 공백 | `separateSpace` | `space` | `ml-space` |
| Punctuation · 문장부호 | `separatePunct` | `punctuation` | `ml-punct` |
| Numbers · 숫자 | `separateNum` | `number` | `ml-num` |

> **CJK note**: 일본어 한자(漢字)는 Unicode `Script=Han`이라 중국어 한자와 구분되지 않습니다 (모두 `chinese`로 분류). 같은 segment 안에 히라가나/가타카나가 있어야 일본어로 인식됩니다. `languageOverrides`로 lang을 보정하거나 `glyphOverrides`로 개별 문자를 지정할 수 있습니다.

> **CJK**: Japanese kanji share Unicode's `Script=Han` with Chinese — standalone kanji classify as `chinese`. Japanese is only inferred when Hiragana or Katakana is in the same segment. Use `languageOverrides` or `glyphOverrides` to adjust.

## 옵션 · Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `autoInit` | boolean | `false` | When true, `init()` schedules a wrap of `selector` after `delay` ms. |
| `selector` | string | `'body'` | CSS selector for the auto-init wrap. |
| `delay` | number | `100` | ms to wait before the auto-init wrap. |
| `separateSpace` | boolean | `false` | Give whitespace its own segments (`ml-space`). |
| `separatePunct` | boolean | `false` | Give punctuation its own segments (`ml-punct`). |
| `separateNum` | boolean | `false` | Give digits their own segments (`ml-num`). |
| `glyphOverrides` | object | `{}` | Map of character strings to script names (e.g. `'()[]{}': 'latin'`). |
| `languageOverrides` | object | `{}` | Override BCP-47 `lang` attribute per script (e.g. `{chinese: 'zh-TW'}`). |
| `skipElements` | string[] | `['script','style','noscript','template']` | Tag names to skip during traversal. |
| `useClassNames` | boolean | `true` | Emit `ml-xx` classes on each span. |
| `debug` | boolean | `false` | Console logging. |

자세한 옵션별 시각 예시는 [index.html](index.html)에서 확인할 수 있습니다.

> See [index.html](index.html) for live before/after demos of each option.

## 동작의 미묘한 점 · Behavior nuances

- **공백·문장부호는 인접 스크립트에 흡수됩니다**. `"안녕 hello"`는 `<span ko>안녕 </span><span en>hello</span>` — 공백이 한국어 span에 포함됩니다 (직전 글자의 스크립트 상속). 이는 span 스타일(배경색·테두리·padding)이 공백 위로도 자연스럽게 이어지게 하기 위함입니다.
- **분리된 카테고리는 inheritance에 참여하지 않습니다**. `separatePunct: true` 켠 상태에서 `"한국어, 좋아요"`는 `<span ko>한국어</span><span punct>,</span><span ko> 좋아요</span>` — 쉼표 다음 공백은 punct가 아닌 가장 가까운 진짜 스크립트(korean)를 상속합니다.
- **`<span data-script="space">` 등 카테고리 segment에는 `lang` 속성을 emit하지 않습니다** (언어가 아니라 카테고리이므로). 부모 요소의 `lang`이 자연스럽게 상속됩니다.
- **숫자는 기본적으로 latin으로 분류됩니다** — Unicode 상 숫자는 `Script=Common`이라 `\p{Script=Latin}`과 매치되지 않지만, 일반적인 본문에서는 latin과 묶이는 게 자연스러워서 fallback으로 latin을 부여합니다. 분리하고 싶다면 `separateNum: true`.

## 브라우저 지원 · Browser support

ES2018+ (Chrome 64+, Firefox 78+, Safari 11.1+). Unicode property escapes (`\p{Script=...}`)에 의존합니다.

## 역사 · History

이 라이브러리는 2016년 공개된 [multilingualjs/multilingual.js](https://github.com/multilingualjs/multilingual.js)의 컨셉을 이어받은 v2입니다. 원본은 어도비 인디자인의 *합성글꼴(Composite Fonts)* 기능에서 영감을 받아 한 단락 안에 섞인 여러 문자세트를 글자별로 골라내 따로 스타일링할 수 있게 한 jQuery 플러그인이었고, `ml-en` `ml-ko` `ml-num` `ml-punct` 같은 클래스 이름 규약은 거기서 그대로 가져왔습니다. v2는 컨셉을 유지하면서 의존성 제거, Unicode property escape 기반 감지, 지원 문자세트 확대, 단순화된 API로 재작성한 것입니다.

> This is a v2 carrying forward the concept of [multilingualjs/multilingual.js](https://github.com/multilingualjs/multilingual.js) (2016) — a jQuery plugin inspired by Adobe InDesign's *Composite Fonts* feature. The class-name convention (`ml-en` etc.) is inherited from the original; v2 modernizes the implementation (zero deps, Unicode property escapes, more scripts, simpler API).

전체 변경 이력은 [HISTORY.md](HISTORY.md)를 참조하세요.

## License

MIT

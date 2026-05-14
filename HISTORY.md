# History

## 원본 라이브러리 · The original

[multilingualjs/multilingual.js](https://github.com/multilingualjs/multilingual.js) (2016) — 어도비 인디자인의 *합성글꼴(Composite Fonts)* 기능에서 영감을 받은 jQuery 플러그인. 한국어 본문 속 영문·숫자·문장부호를 정규식으로 골라내 별도 클래스로 감싸 주는 화면 타이포그래피용 도구였습니다.

> A 2016 jQuery plugin inspired by Adobe InDesign's *Composite Fonts* feature. Tagged Latin / numbers / punctuation inside Korean prose with their own classes (`ml-en`, `ml-num`, `ml-punct`) so each could receive its own font and metric adjustments.

원본의 핵심 아이디어와 클래스 이름 규약(`ml-en`, `ml-ko`, `ml-num`, `ml-punct` …)은 v2에서도 그대로 이어집니다.

> v2 keeps the original's core idea and class-name convention.

## v2 (2026) — 재작성 · Rewrite

원본은 jQuery 의존, 한정된 정규식 기반 감지, 다소 복잡해진 옵션 구조였습니다. v2는 같은 컨셉을 유지하면서 다음을 바꿨습니다:

> v2 keeps the same concept and a similar surface area, but reimplements everything as a small modern library:

- **의존성 제거.** 순수 자바스크립트 ~270줄. jQuery 불필요.
- **Unicode property escapes 기반 감지.** 하드코딩된 코드포인트 범위 대신 `\p{Script=Hangul}` 같은 표준 속성을 사용 — Unicode가 새 블록을 추가해도 자동 대응되고, 빠진 범위가 없습니다.
- **지원 문자세트 확대.** 영문·한글·한자·가나에 더해 아랍, 키릴, 그리스, 히브리, 태국, 데바나가리. 카테고리 3종(공백·문장부호·숫자)도 옵션으로 분리 가능.
- **재귀 DOM 순회.** TreeWalker 대신 8줄짜리 재귀 함수.
- **단순화된 API.** `Multilingual.init()` / `Multilingual.wrap()` / `new Multilingual()` 세 가지 패턴. 옵션은 11개에서 10개로 정리했고 각자 직교적입니다.

## 주요 설계 결정 · Key design decisions

이 라이브러리를 사용·확장할 때 알아 두면 좋은 결정 사항들:

> Decisions worth knowing when using or extending the library:

### Whitespace inheritance (default behavior)

공백과 문장부호는 기본적으로 주변 스크립트에 흡수됩니다. `"안녕 hello"`는 `<span ko>안녕 </span><span en>hello</span>`이 되어, 한국어 span의 배경·테두리·padding이 공백까지 자연스럽게 이어집니다. 이는 시각적 일관성을 위한 기본값입니다.

> Spaces and punctuation inherit the nearest neighbor's script by default. This keeps span styling (backgrounds, borders, padding) continuous across word gaps.

공백·문장부호·숫자를 별도 segment로 분리하고 싶다면 `separateSpace`, `separatePunct`, `separateNum` 옵션을 각각 켜세요.

> Set `separateSpace`, `separatePunct`, or `separateNum` to split a category into its own segments.

### Category scripts don't propagate

분리된 카테고리(`space`, `punctuation`, `number`)는 inheritance 전파에 참여하지 않습니다. 예를 들어 `separatePunct: true`만 켠 상태에서 `"한국어, 좋아요"`를 wrap하면, 쉼표 뒤 공백은 punct가 아닌 가장 가까운 진짜 스크립트(korean)를 상속해 자연스럽게 한국어 span에 묶입니다.

> Category-pseudo-scripts are excluded from inheritance propagation. A stray space next to a separated comma still inherits the nearest *real* script — not the punct script — so styling doesn't bleed.

### CJK ambiguity

일본어 한자(漢字)와 중국어 한자(汉字)는 Unicode 상 둘 다 `Script=Han`이라, 한자만 단독으로 있는 segment는 항상 `chinese`로 분류됩니다. 같은 segment 안에 히라가나·가타카나가 같이 있어야 일본어로 인식됩니다. 알려진 한계이며 문자 단위 감지로는 해결되지 않습니다.

> Japanese kanji and Chinese hanzi share `Script=Han`, so standalone kanji always classifies as `chinese`. Japanese is only inferred when hiragana/katakana co-occurs. Known limitation; not solvable at the per-character level.

### Number handling

숫자는 Unicode 상 `Script=Common`이라 어느 스크립트 패턴에도 매치되지 않지만, 일반적인 본문에서는 latin과 묶이는 게 자연스러워 기본적으로 latin으로 분류합니다. 별도 `ml-num` 클래스로 분리하려면 `separateNum: true`.

> Digits are `Script=Common` in Unicode and don't match any script pattern, so they default to latin (which is usually the right choice for prose). Set `separateNum: true` to split them into their own `ml-num` segments.

### Tag → script mapping is fixed

`korean` → `lang="ko"` 같은 매핑은 라이브러리에 하드코딩되어 있습니다. 변경하려면 `languageOverrides` 옵션을 사용하세요 (예: `{chinese: 'zh-TW'}`로 번체 중국어 지정).

> Script-to-`lang` mapping is hardcoded. Use `languageOverrides` to change emitted lang values (e.g. `{chinese: 'zh-TW'}` for Traditional Chinese).

## License

MIT — 원본 라이브러리도 MIT.

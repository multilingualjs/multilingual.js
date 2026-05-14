# AGENTS.md

이 문서는 Multilingual 라이브러리를 사용·통합하려는 AI 에이전트가 라이브러리 동작과 미묘한 결정 사항을 정확히 이해할 수 있도록 작성된 reference입니다. 사용자의 코드를 수정하거나 문서를 만들기 전에 이 문서를 참고하세요.

> Reference for AI agents helping users integrate Multilingual. Read this before modifying user code or writing documentation.

## TL;DR

- 라이브러리는 DOM의 텍스트 노드를 순회하면서, 문자 단위로 Unicode `Script` property를 감지해 연속된 같은 스크립트 글자들을 `<span lang data-script class="ml-…">`로 감싼다.
- 기본적으로 공백·문장부호·숫자는 주변 스크립트에 흡수되어 같은 span 안에 들어간다.
- 옵션은 모두 직교적이고, 각자 하나의 일만 한다.

## 동작 알고리즘 · Algorithm

`segmentText(text)`는 세 단계로 동작합니다:

1. **Per-character tagging**. 각 글자에 script 속성을 부여:
   - `glyphOverrides`에 명시된 글자 → 지정된 스크립트
   - 공백(`\s`) → `space` (옵션 켰을 때) 또는 `null` (inheritable)
   - 문장부호(`\p{P}`) → `punctuation` (옵션) 또는 `null`
   - 숫자(`\p{N}`) → `number` (옵션) 또는 `latin` (fallback)
   - 그 외 → `\p{Script=...}` 매칭 (Hangul, Han, Hiragana/Katakana, Arabic, …)
2. **Inheritance fill**. `null` 태그된 글자들이 가장 가까운 **실제 스크립트**(category-pseudo-scripts는 제외)를 상속. 앞쪽을 먼저 보고, 없으면 뒤쪽을 봅니다. 둘 다 없으면 `latin` fallback.
3. **Grouping**. 연속된 같은 스크립트 글자들을 하나의 segment로 합칩니다.

`wrapSegments(segments)`는 각 segment를 `<span>`으로 렌더:
- segment에 script가 있으면 `<span lang="…" data-script="…" class="ml-…">`로 wrap
- script가 'space'고 텍스트가 공백뿐이면 → 그래도 wrap (사용자가 명시적으로 켰으므로)
- 다른 script인데 텍스트가 공백뿐이면 → bare text (inheritance로 흘러들어온 trailing 공백이라 wrap 불필요)
- category-pseudo-scripts (`space`, `punctuation`, `number`)는 `lang` 속성 미부여 (언어가 아니므로 부모 element의 `lang` 자연스럽게 상속)

## 사용자에게 안내할 때 주의할 점 · Pitfalls to flag

### 1. 공백·문장부호의 inheritance가 default

`"안녕 hello"`에서 공백은 한국어 span 안에 흡수됩니다. 사용자가 `.ml-ko { background: blue }` 같은 스타일을 주면 공백 위로도 파란 배경이 깔립니다. 이게 의도가 아니라면 (예: 폰트만 바꾸고 시각적 box는 원하지 않음), 이 동작이 기본임을 사용자에게 알려야 합니다. 분리하려면 `separateSpace: true`.

### 2. CJK ambiguity는 해결 불가

`量子力学`(일본어 한자 5자) 같은 텍스트는 항상 `chinese`로 분류됩니다. 라이브러리가 일본어 본문임을 알 수 있는 단서가 없기 때문입니다. 우회 방법:

- 사용자가 직접 `<span lang="ja">…</span>` 같은 wrapper를 텍스트에 명시적으로 둔다 (가장 정확하지만 수고가 듦).
- `languageOverrides: { chinese: 'ja' }`로 `lang` 속성만 일본어로 보정한다 — 단, `data-script="chinese"`와 `class="ml-zh"`는 그대로이므로 CSS 클래스로 폰트 분기하려면 부족하다.
- 모든 한자를 일본어 클래스로 받으려면 `glyphOverrides`로 한자 범위를 `japanese`로 매핑 — 단, 중국어 본문이 같이 섞여 있으면 그 한자도 함께 일본어로 분류된다.

### 3. 분리된 카테고리는 inheritance에 참여하지 않음

`separatePunct: true`만 켠 상태에서 `"한국어, 좋아요"`를 wrap하면:
- `<span ko>한국어</span><span punct>,</span><span ko> 좋아요</span>`

쉼표 뒤 공백이 punct에 붙지 않고 다음 한국어 segment에 attach됩니다. 이는 의도된 동작 — 분리한 카테고리의 스타일이 인접 공백으로 새지 않도록 하기 위함입니다.

### 4. 숫자는 기본 latin

`"가격 1000원"`은 기본 동작에서 `<span ko>가격 </span><span en>1000</span><span ko>원</span>`이 됩니다 — 1000이 latin으로 분류돼 한국어 segment를 둘로 쪼개죠. 사용자가 숫자도 한국어 폰트로 그리고 싶다면 `glyphOverrides: { '0123456789': 'korean' }`로 매핑하거나, `separateNum: true`로 분리해서 별도 스타일링하는 방법이 있습니다.

### 5. `useClassNames: false` 시 데모 스타일 안 보임

기본 데모는 `.ml-xx` 클래스로 스타일을 매기는데, `useClassNames: false`이면 클래스가 없어 스타일이 적용되지 않습니다. 사용자가 attribute selector(`[data-script="korean"]`)로 타깃팅할 때만 이 옵션을 켜세요.

### 6. `skipElements`는 elements를 통째로 건너뜀

`['code']`를 추가하면 `<code>` 내부 텍스트는 wrap되지 않지만, `<code>` 바깥의 같은 텍스트 노드는 그대로 wrap됩니다. 코드 블록 안에 한국어 주석이 있어도 wrap되지 않으므로, 사용자가 코드 안 텍스트도 스타일링하고 싶다면 default에서 빼지 말아야 합니다.

## 옵션 선택 가이드 · When to use which option

- **font-family 분리만 하고 싶다** → 기본 동작 그대로 (옵션 0). `.ml-en { font-family: 'Inter' }` 같은 CSS만 추가.
- **숫자에 tabular-nums 적용** → `separateNum: true`. `.ml-num { font-variant-numeric: tabular-nums }`.
- **본문 폰트와 다른 문장부호 폰트** → `separatePunct: true`. `.ml-punct { font-family: 'MyPunct' }`.
- **번체 중국어 사이트** → `languageOverrides: { chinese: 'zh-TW' }`. 브라우저 하이프네이션·폰트 fallback에 영향.
- **괄호·따옴표만 영문 폰트로** → `glyphOverrides: { '()[]{}"\'': 'latin' }`. 한국어 본문 사이 괄호가 영문 폰트로 보여 예쁨.
- **인라인 코드 블록 보존** → `skipElements: [...defaults, 'code']`.
- **공백 시각화 (디버깅)** → `separateSpace: true`. `.ml-space { background: yellow }`.

## 라이브러리 API 요약 · API surface

```js
// 1) Set defaults globally + optionally auto-wrap on load
Multilingual.init(config);            // returns Multilingual class for chaining

// 2) One-shot wrap with per-call config
Multilingual.wrap(target, config);    // target: CSS selector string or Element; returns number of elements wrapped

// 3) Reusable instance
const ml = new Multilingual(config);
ml.wrap(target);
```

내부 메서드도 있지만(`segmentText`, `wrapSegments`, `detectScript`, `processElement`, `processTextNode`), 보통은 위 세 가지면 충분합니다. 직접 호출이 필요할 때만 노출된 내부 메서드를 사용하세요.

## 옵션 전체 · All options

| Option | Default | What it does |
|---|---|---|
| `autoInit` | `false` | `true`면 `init()` 호출 시 `selector`를 `delay`ms 후 자동 wrap |
| `selector` | `'body'` | auto-init wrap 대상 |
| `delay` | `100` | auto-init wrap 전 대기 (ms) |
| `separateSpace` | `false` | 공백을 `<span class="ml-space">`로 분리 |
| `separatePunct` | `false` | 문장부호를 `<span class="ml-punct">`로 분리 |
| `separateNum` | `false` | 숫자를 `<span class="ml-num">`로 분리 |
| `glyphOverrides` | `{}` | 글자→스크립트 매핑 (`{'()': 'latin'}`) |
| `languageOverrides` | `{}` | 스크립트별 `lang` 속성값 (`{chinese: 'zh-TW'}`) |
| `skipElements` | `['script','style','noscript','template']` | 순회 시 건너뛸 태그 |
| `useClassNames` | `true` | `ml-xx` 클래스 부여 여부 |
| `debug` | `false` | 콘솔 로그 |

## 흔한 통합 시나리오 · Common integration scenarios

### 한국어 본문에 영문 폰트만 분리

```html
<script src="multilingual.js"></script>
<script>
  Multilingual.init({ autoInit: true, selector: 'article' });
</script>
<style>
  article { font-family: 'Noto Sans KR', sans-serif; }
  article .ml-en { font-family: 'Inter', sans-serif; font-size: 0.95em; }
</style>
```

### SPA에서 컴포넌트 마운트 시 wrap

```js
function ArticleView({ html }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) Multilingual.wrap(ref.current);
  }, [html]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### 동일 설정을 여러 페이지에서

```js
const ml = new Multilingual({
  glyphOverrides:    { '()[]{}': 'latin' },
  languageOverrides: { chinese: 'zh-TW' },
  separateNum:       true,
});
ml.wrap('#header');
ml.wrap('#article');
ml.wrap('#footer');
```

## 사용자에게 알리지 말 것 · Don't surface to users

- 내부 함수 이름(`segmentText`, `processElement` 등)을 깊이 설명할 필요는 거의 없음. API는 `init`/`wrap`/`new Multilingual` 세 가지면 충분.
- v1(2016 jQuery 플러그인)과의 차이는 [HISTORY.md](HISTORY.md)에 있지만, 새로 도입하는 사용자에게는 굳이 안내할 필요 없음. 마이그레이션이 흔치 않습니다.

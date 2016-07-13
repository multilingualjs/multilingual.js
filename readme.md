# multilingual.js

multilingual.js는 [어도비 인디자인의 합성글꼴 기능](https://helpx.adobe.com/incopy/using/using-fonts.html#composite_fonts)처럼, HTML/CSS 환경에서 보다 섬세하게 다국어 섞어쓰기를 제어하기 위한 오픈소스 자바스크립트 라이브러리이다.

이 플러그인은 HTML문서 안에서 특정 문자세트로 표기된 단어들을 정규식(Regular Expression)으로 골라내어 그 단어들을  `<span>` 태그로 감싸고, 언어 및 부호에 따라 별도의 클래스 이름을 부여한다. 기본으로 지원되는 문자세트는 영문(`en`), 한글(`ko`), 중문(`cn`), 일문(`jp`), 숫자(`num`), 문장부호(`punct`)가 있고, 별도로 낱자들을 골라내어 별도의 클래스 이름을 지정하는 것도 가능하다.

[![NPM](https://nodei.co/npm/multilingual.js.png?downloads=true)](https://nodei.co/npm/multilingual.js/)


## 설치하기

#### 다운로드 하기
최신 버전은 https://github.com/multilingualjs/multilingual.js/releases 에서 다운로드 가능하다.

HTML의 head 태그 안에 스타일시트 파일을 삽입한다.

    <link href="multilingual.css" rel="stylesheet" />

### 자바스크립트 파일 설치

## jQuery
```HTML
<script src="jquery.multilingual.min.js"></script>
```

## npm
```HTML
npm install multilingual.js
```


## 사용하기

설치가 완료되면, 자바스크립트에서 아래와 같이 설정하고 초기화할 수 있다.

jQuery의 경우
```javascript
<script>
  $(document).ready(function(e){
    $(".content").multilingual([
      "en", "num"
    ]);
  });
</script>
```

npm을 통해 사용할 경우 
```javascript
var MultiLingual = require('multilingual.js');

var ml = new MultiLingual({
  containers: document.getElementsByClassName("content"), // 배열 형태를 띈 dom 요소를 불러옵니다. $(".content") 와 같은 형태 
  configuration: ["en", "num"]
});
```

위의 예시에서는 페이지가 로딩될 때마다 `content` 클래스를 가진 요소 안의 모든 내용을 검색하여, 영문(`en`)과 숫자(`num`)을 골라내어 각각 의 단어/글자에 `ml-en` 또는  `ml-num` 클래스 이름을 할당한다. 이렇게 처리된 문서의 HTML 구조는 다음과 같다.

원본:
```HTML
<p>모든 CCL의 메타데이터에는 최소한 license 값을 기술하는 1개의 RDF 트리플이 반드시 포함됩니다.</p>
```

처리후:
```HTML
<p>모든 <span class="ml-en">CCL</span>의 메타데이터에는 최소한 <span class="ml-en">license</span> 값을 기술하는 <span class="ml-num">1</span>개의 <span class="ml-en">RDF</span> 트리플이 반드시 포함됩니다.</p>
```
처리후에는 각각의 문자세트가 독자적인 클래스 이름으로 구별되어 있기 때문에, 각 클래스 이름에 해당하는 CSS 스타일을 적용해 주는것으로, 섞어쓰기의 세부적인 사항들을 제어할 수 있다.

```CSS
/* example css for multilingual.js */
p {
  font-family: NotoSans, Helvetica, Arial, sans-serif;
  font-size:16px;
  line-height: 23px;
}
.ml-en, .ml-num {
  font-family: LiberationMono, Courier, monospace;
  letter-spacing: -0.02em;
  position:relative;
  top:-0.05em;
}
.ml-num {
  color: gray;
}
```


## 옵션

#### 기본 문자세트
multilingual.js가 지원하는 기본 문자세트는 다음과 같다.

| 문자의 범위  | 문자세트의 이름 |
| ------------- |:-------------:|
| English `[a-zA-Z]+`                          | `'en'` |
| Korean `[ㄱ-ㅎ가-힣ㅏ-ㅣ]+`                             | `'ko'` |
| Japanese `[\u3040-\u309F\u30A0-\u30FF]+`     | `'jp'` |
| Chinese `[\u4E00-\u9FBF]+`                   | `'cn'` |
| Numeric `[0-9]+`                             | `'num'` |
| Punctuations `[\(\).,（）。、·，;:」“”\"\'\-<>\&]+`     | `'punct'` |

#### 커스텀 문자세트
기본 문자세트 이외에도 특정 글자들을 선택하여 클래스이름을 지정할 수 있다. 이를테면 영문 폰트와 별개로 괄호만 스타일링하고 싶을 때에는 다음과 같이 초기화 배열 안에 오브젝트로 옵션을 지정해 주고, 지정한 클래스 이름 (`className`) 을 CSS에서 선언하면 된다.

```javascript
     $(".content").multilingual([
      "en", {
        className: "ml-parentheses", /* 클래스 이름은 어떤 것이든 가능하다. Class name can be anything */
        charset: '()' /* ml-parenthesis 클래스 안에 포함될 문자세트를 지정해준다. characters to be selected, within '' */
      }
    ]);
```

## 사용예시

 multilingual.js는 아래의 예시처럼  `body` 등 HTML의 기본요소에 타이포그래피의 기본이 되는 속성들을 우선 선언하고, `ml-en` 또는 `ml-num` 등 필요한 클래스 이름에 선택적으로 추가 속성을 선언하여 오버라이드할 것을 권한다.

```CSS
body {
  font-family: NotoSans, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 23px;
}
.ml-en, .ml-punct .ml-parentheses {
  /* shared styles for 'en', 'punct', and parentheses */
  font-family: SourceCodePro, Courier, monospace;
  font-size: 1.1em;
}
.ml-parentheses {
  /* specific style for parentheses */
  /* shifting baseline */
  position:relative;
  top: -0.05em;
  /* adjust spacing before and after character */
  letter-spacing: -0.1em;
  margin-left:-0.1em;
}
```

#### 글자 크기 및 그 외 속성의 조절
글자의 크기는 기본으로 설정된 폰트 크기를 기준으로 상대값으로 ( `em`  또는 `%` 등) 작성한다. `font-size: 1.1em;` 은 `font-size: 110%;` 와 동일한 선언으로, 위의 예시에서는 글자크기가 `17.6px` 로 표시된다.

이 외에도, CSS3의 기본적인 타이포그래피 속성—`line-height` , `letter-spacing` , `font-weight` 등—은 모두 사용할 수 있다. 다만 `px` 이나 `pt` 등 절대 단위로 속성을 정의하게 되면 매번 상속받는 속성의 글자 크기의 변화에 대응하지 못하므로 언제나 상대값으로 정의하는 것이 바람직하다.

#### 글줄 (베이스라인)의 조절 ###
CSS3 표준에서 글줄을 손쉽게 조절할수 있는 방법은 없으므로, 편법에 의존할 수 밖에 없다.

```CSS
.ml-parentheses {
  /* shifting baseline */
  position:relative;
  top: -0.05em;
}
```

## 데모

multilingual.js의 온전한 데모는 http://multilingualjs.github.io 에서 볼 수 있다.


#### 추후 개선사항

동적으로 컨텐츠가 추가될 경우에 이미 <span>태그로 감싸져 있는 컨텐츠들에 한번 더 <span>을  적용하게되는 문제가 있어 정규식의 개선이 필요하다.

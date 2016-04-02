# **multilingual.js**

이것은 사용자가 지정한 특정 글리프 세트를 span으로 묶어주는 라이브러리이다. 이거는 인디자인에서 제공하는 합성글꼴의 기능을 웹에서 구현하고자 하는것이다. CJK 언어권의 비애를 극복하려는 노력의 일환이다. 타이포잔치 웹사이트를 만들다가 제작했는데, 그걸 다듬어서 공개한다.


----------
# Background

한글과 영문은 섞어쓰기 어렵고, 이건 CJK모두가 마찬가지, 그리고 나아가 비 라틴 언어권 (아랍어등) 모든 타이포그라피에서 필수적인 문제다. 어떻게 섞어쓸 것인가.


----------
# Individual styling by charset

이 플러그인은 캐릭터셋에 따라서 문자열을 `<span>` 으로 묶어준다. 프리셋으로, en, ko num, punct 가 있다. 그래서 예를들어 문단이 아래와 같다면


    <p>이 statement는 Vogue style로 무심한듯 chic하게 작성되었다.</p>

이렇게 바꿔주게 된다.


    <p><span class="ml-ko">이</span> <span class="ml-en">statement</span><span class="ml-ko">는</span> <span class="ml-en">Vogue style</span><span class="ml-ko">로 무심한듯</span> <span class="ml-en">chic</span><span class="ml-ko">하게 작성되었다.</span></p>

그러므로 각 charset(언어)에 따라 다른 서체를 사용할 때 서체 별로 약간씩 다른 크기라든가 베이스라인 등을 조절해서 정교한 타이포그라피를 할 수 있다. (구체적인 속성의 조절은 아래 css 참조)


----------
# Installation
### Download 하면되고 어쩌고...

CDN

NPM

Download from github 


# CSS

인스톨이 되면, 단락을 쪼개줄것이므로 해당 클래스 이름들에 크기와 베이스라인 조절은 아래와같이 하면 된다.


    /* example css for multilingual.js */
    p {
      font-size: 14px;
      line-height: 18px;
    }
    span.ml-en {
      font-family: Helvetica, Arial, sans-serif;
    }
    span.ml-ko {
      font-family: 'Nanum Gothic', Arial, sans-serif;
      font-size:15px;
      //below two lines are for baseline shift
      position:relative;
      top:.1em;
    }



# Options

**Predefined character sets**

**Character Range**
**Attribute**
English [a-zA-Z]+
‘en’
Korean [가-힣]+
‘ko’
Japanese
‘jp’
Chinese
‘cn’
Numeric [0-9]+
‘num’
Punctuations [!@#$%^&*\(\).,“”\-]+
‘punct’

    $(".container").multilingual([
      "en", "ko","num"
    ])

**Custom character sets**
커스텀 캐릭터 세트는 유니크한 클래스 네임이 있어야 하고, 선택할 문자열이 있어야 한다. 이거는 key:value 페어로 옵션에서 아래와같이 지정해주면 된다.

className
*your-custom-class-name*
charset
*string (e.g: 1234)*

    $(".container").multilingual([
      "en", 
      "ko",
      "num", 
      {
       className: "my-charset",
       charset: "1234"
       }
    ])




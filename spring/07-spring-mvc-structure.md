---
title: 스프링 MVC 구조 — 프론트 컨트롤러와 DispatcherServlet
---

## MVC 패턴

| 구성 | 역할 |
|---|---|
| **Controller** | HTTP 요청을 받아 파라미터를 검증하고 비즈니스 로직을 실행. 뷰에 전달할 결과를 조회해 모델에 담는다 |
| **Model** | 뷰에 출력할 데이터를 담는다. 덕분에 뷰는 비즈니스 로직이나 데이터 접근을 몰라도 되고 렌더링에만 집중할 수 있다 |
| **View** | 모델의 데이터로 화면(HTML)을 그리는 일에 집중 |

> 컨트롤러에 비즈니스 로직을 둘 수도 있지만 역할이 너무 많아진다. 보통 **서비스 계층**을 따로 두고, 컨트롤러는 서비스를 호출하는 역할만 맡는다.

![MVC 패턴](./images/mvc-pattern.png)

1. 클라이언트가 요청을 보내면 컨트롤러가 호출된다.
2. 컨트롤러는 요청을 검증하고 서비스·리포지토리를 호출해 비즈니스 로직을 실행한다.
3. 결과를 모델에 담는다.
4. 뷰 로직을 호출한다.
5. 뷰는 모델 데이터를 참조해 응답을 생성한다.
6. 클라이언트가 응답을 받는다.

## 프론트 컨트롤러 패턴

![프론트 컨트롤러 도입 전후](./images/front-controller.png)

- 프론트 컨트롤러 서블릿 **하나**로 모든 요청을 받는다.
- 요청에 맞는 컨트롤러를 찾아서 호출한다.
- 공통 처리가 가능하다.
- 프론트 컨트롤러를 제외한 나머지 컨트롤러는 서블릿을 사용하지 않아도 된다.

스프링 웹 MVC의 핵심이 바로 이 패턴이고, 그 구현체가 **DispatcherServlet**이다.

## DispatcherServlet

### 등록

- 상속 구조: `DispatcherServlet → FrameworkServlet → HttpServletBean → HttpServlet` — 결국 서블릿으로 동작한다.
- 스프링 부트는 DispatcherServlet을 자동 등록하면서 **모든 경로(`urlPattern="/"`)** 에 매핑한다. 더 구체적인 경로가 우선순위가 높아서 기존에 등록한 서블릿도 함께 동작한다.

### 요청 흐름

1. 서블릿이 호출되면 `HttpServlet.service()`가 호출된다.
2. 스프링 MVC는 부모인 `FrameworkServlet`에서 `service()`를 오버라이드해 두었다.
3. 여러 메서드를 거쳐 **`DispatcherServlet.doDispatch()`** 가 호출된다.

```java
// 예외 처리, 인터셉터는 생략한 핵심 흐름
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    // 1. 핸들러 조회
    HandlerExecutionChain mappedHandler = getHandler(request);
    if (mappedHandler == null) {
        noHandlerFound(request, response);
        return;
    }

    // 2. 핸들러 어댑터 조회
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

    // 3~5. 어댑터 실행 → 핸들러 실행 → ModelAndView 반환
    ModelAndView mv = ha.handle(request, response, mappedHandler.getHandler());

    processDispatchResult(request, response, mappedHandler, mv, dispatchException);
}

protected void render(ModelAndView mv, HttpServletRequest request, HttpServletResponse response) {
    // 6~7. 뷰 리졸버로 뷰 찾기 → View 반환
    View view = resolveViewName(mv.getViewName(), mv.getModelInternal(), locale, request);
    // 8. 뷰 렌더링
    view.render(mv.getModelInternal(), request, response);
}
```

![스프링 MVC 구조](./images/spring-mvc-structure.png)

| 단계 | 설명 |
|---|---|
| 1. 핸들러 조회 | 핸들러 매핑으로 요청 URL에 매핑된 핸들러(컨트롤러)를 찾는다. URL 외에 HTTP 헤더 등도 활용 |
| 2. 핸들러 어댑터 조회 | 그 핸들러를 실행할 수 있는 어댑터를 찾는다 |
| 3. 핸들러 어댑터 실행 | |
| 4. 핸들러 실행 | 어댑터가 실제 핸들러를 실행 |
| 5. ModelAndView 반환 | 어댑터가 핸들러의 반환 정보를 ModelAndView로 **변환**해서 반환 |
| 6. viewResolver 호출 | JSP면 `InternalResourceViewResolver`가 자동 등록되어 사용 |
| 7. View 반환 | 논리 뷰 이름 → 물리 이름으로 바꾸고 렌더링 담당 View 객체 반환. JSP면 `InternalResourceView(JstlView)` — 내부에 `forward()` 로직 |
| 8. 뷰 렌더링 | |

## 핸들러 매핑과 핸들러 어댑터

스프링 부트가 자동 등록하는 주요 구현체 (실제로는 더 많다):

| 우선순위 | HandlerMapping | 대상 |
|---|---|---|
| 0 | **RequestMappingHandlerMapping** | `@Controller`, `@RequestMapping` 애노테이션 기반 컨트롤러 |
| 1 | BeanNameUrlHandlerMapping | 요청 URL과 같은 이름의 스프링 빈 (예: `/springmvc/old-controller`) |

| 우선순위 | HandlerAdapter | 대상 |
|---|---|---|
| 0 | **RequestMappingHandlerAdapter** | `@RequestMapping` 애노테이션 기반 컨트롤러 |
| 1 | HttpRequestHandlerAdapter | `HttpRequestHandler` — 서블릿과 가장 유사한 형태. 반환이 void라 메서드 안에서 다 처리 |
| 2 | SimpleControllerHandlerAdapter | `Controller` 인터페이스 (애노테이션 X, 과거 방식) |

## 뷰 리졸버

스프링 부트는 `application.properties`의 `spring.mvc.view.prefix`, `spring.mvc.view.suffix`로 `InternalResourceViewResolver`를 자동 등록한다.

| 우선순위 | ViewResolver | 설명 |
|---|---|---|
| 1 | BeanNameViewResolver | 빈 이름으로 뷰를 찾아 반환 (예: 엑셀 다운로드 뷰) |
| 2 | InternalResourceViewResolver | JSP를 처리하는 뷰 반환 |

- JSTL 라이브러리가 있으면 `InternalResourceView`를 상속한 `JstlView`를 반환한다.
- JSP는 `forward()`로 이동해야 렌더링되고, 나머지 뷰 템플릿은 `forward()` 없이 바로 렌더링된다.
- Thymeleaf는 `ThymeleafViewResolver`가 필요한데, 요즘은 라이브러리만 추가하면 스프링 부트가 자동 등록한다.

## @RequestMapping 기반 컨트롤러

- 가장 우선순위가 높은 `RequestMappingHandlerMapping` + `RequestMappingHandlerAdapter`가 애노테이션 기반 컨트롤러를 지원한다. **실무에서는 거의 100% 이 방식**을 쓴다.
- 인터페이스로 고정되어 있지 않아 **ModelAndView를 반환해도, 문자열(뷰 이름)을 반환해도 된다.**
- 파라미터로 `HttpServletRequest`, `HttpServletResponse`뿐 아니라 `@RequestParam`, `Model` 등을 받을 수 있다.
  - `@RequestParam("username")` ≈ `request.getParameter("username")`. GET 쿼리 파라미터와 POST Form 모두 지원하고, 타입 변환도 자동이다.

## 정리

1. HTTP 요청이 오면 DispatcherServlet(프론트 컨트롤러)이 **핸들러 매핑**에서 핸들러를 조회한다. 스프링 부트가 미리 등록해 둔 매핑을 순서대로 확인한다.
2. 그 핸들러를 처리할 수 있는 **핸들러 어댑터**를 찾는다.
3. 어댑터를 통해 실제 핸들러를 호출하고, 어댑터가 ModelAndView를 반환한다.
4. **viewResolver**를 호출해 View를 받는다.
5. `render()`로 실제 뷰를 렌더링한다 (JSP는 forward).

→ 이어서: [스프링 MVC 기본 기능](./08-spring-mvc-basics.md)

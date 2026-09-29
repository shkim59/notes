---
title: 빌더 패턴과 공변성 (Effective Java 2)
---

# 빌더 패턴과 공변성

> Effective Java 아이템 2: 생성자에 매개변수가 많다면 빌더를 고려하라

## 객체 생성 패턴

### 점층적 생성자 패턴

필수 인자부터 시작해 선택 인자를 단계적으로 늘린 생성자들을 오버로딩하는 방식

```java
public class Coffee {
    private final String type;    // 필수
    private final boolean sugar;  // 선택
    private final boolean milk;   // 선택
    private final String topping; // 선택

    public Coffee(String type) {
        this(type, false, false, null);
    }

    public Coffee(String type, boolean sugar) {
        this(type, sugar, false, null);
    }

    public Coffee(String type, boolean sugar, boolean milk) {
        this(type, sugar, milk, null);
    }

    public Coffee(String type, boolean sugar, boolean milk, String topping) {
        this.type = type;
        this.sugar = sugar;
        this.milk = milk;
        this.topping = topping;
    }
}
```

- **장점**: 객체를 한 번에 완성된 상태로 생성, 불변 객체로 만들기 쉬움
- **단점**
  - 매개변수가 많아질수록 생성자 수가 늘어남
  - `new Coffee("Latte", false, true)`에서 `false`가 설탕인지 우유인지 불분명
  - 클라이언트 코드를 작성하거나 읽기 어려움

### 자바빈즈 패턴

기본 생성자로 생성 후 setter로 속성 설정

```java
Car car = new Car();
car.setModel("Sonata");
car.setYear(2025);
car.setColor("White");
```

- **장점**: 매개변수 이름이 드러나 가독성이 좋음
- **단점**
  - 메서드를 여러 번 호출해야 함
  - 생성이 끝날 때까지 **일관성이 보장되지 않음**
  - **불변 객체로 만들 수 없음** → 스레드 안전성 부족
  - 유효성 검사 시점이 불명확

### 빌더 패턴

- 객체 생성 과정을 분리 → 동일한 생성 절차로 다양한 형태의 객체 생성
  1. 필수 매개변수로 빌더 객체를 얻는다 (필요한 객체를 직접 생성하지 않음)
  2. 빌더가 제공하는 세터 메서드로 선택 매개변수를 설정
  3. `build()`를 호출해 최종 객체를 얻는다
- 가독성 + 불변성 + 유연성
- 빌드하려는 클래스 내부에 정적 멤버 클래스로 둔다
- 빌더의 세터는 빌더 자신을 반환 → 메서드 체이닝 (플루언트 API)

```java
public class Computer {
    private final String cpu;          // 필수
    private final int ramGB;           // 필수
    private final String storage;      // 선택
    private final String graphicsCard; // 선택

    // private 생성자로 외부에서 직접 생성 방지
    private Computer(Builder builder) {
        this.cpu = builder.cpu;
        this.ramGB = builder.ramGB;
        this.storage = builder.storage;
        this.graphicsCard = builder.graphicsCard;
    }

    public static class Builder {
        private final String cpu;
        private final int ramGB;
        private String storage = "256GB SSD";       // 기본값
        private String graphicsCard = "Integrated"; // 기본값

        public Builder(String cpu, int ramGB) {
            this.cpu = cpu;
            this.ramGB = ramGB;
        }

        public Builder storage(String storage) {
            this.storage = storage;
            return this; // 빌더 자신을 반환해 체이닝 가능
        }

        public Builder graphicsCard(String graphicsCard) {
            this.graphicsCard = graphicsCard;
            return this;
        }

        public Computer build() {
            return new Computer(this);
        }
    }
}

Computer gamingPC = new Computer.Builder("Intel i9", 32)
        .storage("1TB NVMe SSD")
        .graphicsCard("NVIDIA RTX 4080")
        .build();

Computer officePC = new Computer.Builder("Intel i5", 16)
        .build(); // 선택 매개변수 생략 시 기본값
```

- **장점**
  - 매개변수의 의미가 명확하다
  - 필요한 매개변수만 설정할 수 있어 유연하다
  - 불변 객체를 유지할 수 있다
  - 생성 전까지 외부에 노출되지 않아 완전한 상태의 객체를 보장한다
  - 계층적으로 설계된 클래스와 함께 쓰기 좋다
- **단점**
  - 빌더 클래스 작성·유지보수 비용 증가 → 단순한 객체에는 오버 엔지니어링

## 공변성과 불공변성

- **공변성**: 서브타입 관계가 제네릭 타입에도 유지되는 특성. B가 A의 서브타입일 때 `List<B>`도 `List<A>`의 서브타입으로 간주
- **서브타입**: 특정 타입이 다른 타입의 기능을 모두 포함하거나 확장하는 관계

```java
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

Animal myAnimal = new Dog();
```

**배열의 공변성** (Java의 배열은 공변적)

```java
// Dog 배열을 Animal 배열에 할당 가능 → 런타임 오류 가능성
Animal[] animals = new Dog[10];

// ArrayStoreException 발생 → 실제 배열은 Dog만 담을 수 있음
animals[0] = new Cat();
```

**불공변성 (Invariance)**: Java의 제네릭은 기본적으로 불공변

```java
List<Dog> dogList = new ArrayList<>();
List<Animal> animalList = dogList; // 컴파일 오류
```

**와일드카드로 공변성 표현**

```java
List<Dog> dogList = new ArrayList<>();
List<? extends Animal> animalList = dogList; // 가능
// animalList.add(new Cat()); // 컴파일 오류
```

## 공변 반환 타이핑

오버라이드하는 메서드의 반환 타입을 원래 반환 타입의 서브타입으로 지정할 수 있는 특성

```java
class Animal {
    public Animal produce() {
        return new Animal();
    }
}

class Dog extends Animal {
    @Override
    public Dog produce() { // 공변 반환 타이핑
        return new Dog();
    }
}

Dog d = new Dog().produce(); // 캐스팅 필요 없음

// 다형성: 컴파일러는 Animal로 간주하므로 캐스팅 필요
Animal polyProducer = new Dog();
Dog d2 = (Dog) polyProducer.produce();
```

## 계층적으로 설계된 클래스와 빌더

```java
public abstract class Pizza {
    public enum Size { SMALL, MEDIUM, LARGE }
    protected final Size size;
    protected final boolean extraCheese;
    protected final boolean pepperoni;

    // 재귀적 타입 한정을 이용한 추상 빌더
    public static abstract class Builder<T extends Builder<T>> {
        protected Size size;
        protected boolean extraCheese = false;
        protected boolean pepperoni = false;

        public T size(Size size) {
            this.size = size;
            return self();
        }
        public T extraCheese() {
            extraCheese = true;
            return self();
        }
        public T pepperoni() {
            pepperoni = true;
            return self();
        }

        public abstract Pizza build();

        // 하위 빌더가 자기 자신을 반환하도록 강제 → 형변환 없이 체이닝
        protected abstract T self();
    }

    protected Pizza(Builder<?> builder) {
        this.size = builder.size;
        this.extraCheese = builder.extraCheese;
        this.pepperoni = builder.pepperoni;
    }
}

public class NyPizza extends Pizza {
    public enum Sauce { TOMATO, PESTO, BBQ }
    private final Sauce sauce;

    public static class Builder extends Pizza.Builder<Builder> {
        private Sauce sauce = Sauce.TOMATO;

        public Builder(Size size) {
            super.size(size);
        }

        public Builder sauce(Sauce sauce) {
            this.sauce = sauce;
            return this;
        }

        @Override
        public NyPizza build() { // 공변 반환 타이핑
            return new NyPizza(this);
        }

        @Override
        protected Builder self() {
            return this;
        }
    }

    private NyPizza(Builder builder) {
        super(builder);
        this.sauce = builder.sauce;
    }
}

public class Calzone extends Pizza {
    public enum Sauce { TOMATO, ALFREDO }
    private final Sauce sauce;
    private final boolean sauceInside;

    public static class Builder extends Pizza.Builder<Builder> {
        private Sauce sauce = Sauce.TOMATO;
        private boolean sauceInside = false;

        public Builder(Size size) {
            super.size(size);
        }

        public Builder sauce(Sauce sauce) {
            this.sauce = sauce;
            return this;
        }

        public Builder sauceInside() {
            this.sauceInside = true;
            return this;
        }

        @Override
        public Calzone build() {
            return new Calzone(this);
        }

        @Override
        protected Builder self() {
            return this;
        }
    }

    private Calzone(Builder builder) {
        super(builder);
        this.sauce = builder.sauce;
        this.sauceInside = builder.sauceInside;
    }
}

// 사용 예시
NyPizza nyPizza = new NyPizza.Builder(Pizza.Size.MEDIUM)
        .pepperoni()
        .sauce(NyPizza.Sauce.BBQ)
        .build();

Calzone calzone = new Calzone.Builder(Pizza.Size.LARGE)
        .extraCheese()
        .sauceInside()
        .build();
```

FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/target/auth-service-0.0.1-SNAPSHOT.jar /app/auth-service.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/auth-service.jar"]

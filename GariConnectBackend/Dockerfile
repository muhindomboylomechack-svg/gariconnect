# Étape 1 : Compilation (Build)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copier les dossiers et fichiers de configuration du wrapper Maven
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# SÉCURITÉ 1 : Nettoyer les retours à la ligne invisibles de Windows (CRLF vers LF)
RUN sed -i 's/\r$//' mvnw

# Assurer les permissions d'exécution sur le script mvnw
RUN chmod +x ./mvnw

# Copier le code source de l'application
COPY src ./src

# SÉCURITÉ 2 : Compiler le projet en forçant l'encodage UTF-8 au niveau du système
RUN ./mvnw clean package -DskipTests -Dfile.encoding=UTF-8 -Dproject.build.sourceEncoding=UTF-8

# Étape 2 : Exécution (Run)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Récupérer uniquement le fichier .jar généré lors de l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Exposer le port par défaut utilisé par Spring Boot
EXPOSE 8080

# Commande d'exécution de l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
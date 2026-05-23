# Étape 1 : Compilation (Build)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copier les dossiers et fichiers de configuration du wrapper Maven
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Assurer les permissions d'exécution sur le script mvnw
# (Indispensable pour éviter l'erreur "Permission denied" sur les serveurs Linux de Render)
RUN chmod +x ./mvnw

# Copier le code source de l'application
COPY src ./src

# Compiler le projet et générer le fichier JAR en ignorant les tests pour accélérer le build
RUN ./mvnw clean package -DskipTests

# Étape 2 : Exécution (Run)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Récupérer uniquement le fichier .jar généré lors de l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Exposer le port par défaut utilisé par Spring Boot
EXPOSE 8080

# Commande d'exécution de l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
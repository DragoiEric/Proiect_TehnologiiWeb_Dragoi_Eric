# Proiect TW – Platforma pentru evaluarea anonima a proiectelor

Aplicatie web pentru gestionarea proiectelor de student, a livrabilelor partiale si a notarii anonime in cadrul unei materii de tip TW.

Sistemul modeleaza cursuri, grupe, proiecte si jurii de studenti care isi evalueaza reciproc proiectele, pastrand anonimatul notelor.

---

## Functionalitati principale

- **Roluri de utilizator**
  - Student
  - Profesor
  - (optional) Admin

- **Cursuri si grupe**
  - Cursuri (ex: "Tehnologii Web")
  - Editii de curs pe semestru (CourseOffering) cu profesor coordonator
  - Grupe de studenti asociate unei editii de curs

- **Proiecte**
  - Fiecare grupa poate avea un singur proiect in cadrul unei editii de curs
  - Membrii proiectului sunt stocati explicit (nu este obligatoriu sa fie identici cu toti membrii grupei)
  - Proiectul are titlu, descriere si alte informatii generale

- **Livrabile (Deliverables)**
  - Fiecare proiect poate defini mai multe livrabile partiale (milestones)
  - Pentru fiecare livrabil:
    - se seteaza deadline si descriere
    - se poate adauga link de video demo
    - se poate adauga link catre un server / deployment
    - se pot atasa fisiere suplimentare

- **Juriu si notare**
  - La fiecare livrabil, un set de studenti care nu fac parte din acel proiect poate fi selectat ca juriu
  - Doar membrii juriului asignat pot acorda nota pentru acel livrabil
  - Notele sunt de la 1 la 10, cu pana la 2 zecimale
  - Notarea este anonima:
    - profesorii vad notele pe proiect, dar nu vad identitatea membrilor juriului
  - Nota finala a proiectului:
    - se elimina cea mai mica si cea mai mare nota
    - se face media notelor ramase
  - Nota finala este stocata separat in `ProjectFinalGrade`

---

## Model de domeniu (entitati principale)

- **User**
  - Date de baza pentru cont
  - Rol (student / profesor / admin)

- **Course**
  - Curs generic (nume, cod etc.)

- **CourseOffering**
  - O editie concreta a unui curs intr-un semestru
  - Legata de `Course`
  - Are profesor principal (`mainProfessorId` -> `User`)

- **Group**
  - Grupa de studenti

- **GroupMember**
  - Leaga un `User` de o `Group`

- **GroupCourseOffering**
  - Leaga o `Group` de o `CourseOffering`

- **Project**
  - Proiectul unei grupe intr-o anumita editie de curs
  - Contine titlu, descriere si alte detalii

- **ProjectMember**
  - Leaga un `User` de un `Project`
  - Poate avea si alte atribute (ex: este sau nu leader)

- **Deliverable**
  - Livrabil partial / milestone al unui proiect
  - Deadline, descriere, tip

- **DeliverableFile**
  - Fisiere asociate unui livrabil
  - Poate memora link video demo, link server si alte resurse

- **JuryAssignment**
  - Leaga un `User` (jurat) de un `Deliverable` al unui proiect
  - Doar acesti utilizatori pot oferi nota pentru acel livrabil

- **Grade**
  - O nota numerica data de un jurat pentru un livrabil
  - Legata de `JuryAssignment` si `Deliverable`

- **ProjectFinalGrade**
  - Nota finala a unui proiect dupa aplicarea regulii:
    - se elimina minimul si maximul
    - se face media notelor ramase

---

## Tehnologii folosite

- **Backend**
  - Node.js
  - Express
  - Sequelize ORM
  - MySQL

---

## Fluxuri principale in aplicatie

- **Inscriere la curs si formare grupe**
  - Studentii se inscriu la o editie de curs (`CourseOffering`)
  - Profesorul sau adminul gestioneaza grupele de studenti (`Group`)
  - Legatura dintre studenti si grupe este stocata in `GroupMember`
  - Grupele sunt atasate unei editii de curs prin `GroupCourseOffering`

- **Definire proiect si livrabile**
  - Fiecare grupa isi creeaza proiectul (`Project`) in cadrul unei editii de curs
  - Membrii proiectului sunt selectati dintre utilizatorii din grupa si salvati in `ProjectMember`
  - Pentru proiect se definesc unul sau mai multe livrabile partiale (`Deliverable`)
  - Pentru fiecare livrabil se pot atasa resurse suplimentare prin `DeliverableFile`
    (link video, link server, alte fisiere)

- **Selectarea juriului**
  - Pentru fiecare livrabil se selecteaza un set de studenti jurati
  - Juratii sunt studenti care nu fac parte din proiectul respectiv
  - Asignarea in juriu este salvata prin `JuryAssignment` (user + deliverable)

- **Acordarea notelor**
  - Fiecare jurat poate acorda o singura nota pentru livrabilul unde este asignat
  - Nota este salvata in `Grade` (legata de `JuryAssignment` si `Deliverable`)
  - Notele sunt stocate anonim; nu se expune identitatea juratului la nivel de interfata
  - Notele sunt pe scala 1–10 cu pana la 2 zecimale

- **Calculul notei finale de proiect**
  - Pe baza tuturor notelor adunate pe livrabile se calculeaza nota finala a proiectului
  - Regula de calcul:
    - se elimina cea mai mica si cea mai mare nota
    - se calculeaza media notelor ramase
  - Rezultatul este salvat in `ProjectFinalGrade`

---

## Scopul proiectului

- Sa ofere un mod organizat de:
  - gestionare a cursurilor, grupelor si proiectelor
  - definire a livrabilelor partiale si a resurselor asociate
  - coordonare a unui sistem de juriu intre studenti
- Sa asigure:
  - **anonimizarea notarii** (studentii nu stiu cine i-a notat)
  - **transparenta pentru profesori** (acestia vad notele si statistici, nu si identitatea juratilor)
  - **un mod corect de calcul** al notei finale, evitand extremele prin eliminarea minimului si maximului




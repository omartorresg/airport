import bcrypt from "bcryptjs";

const hash = "$2a$10$H25ktWoADLU1Q/nldrbRQO9FIRaO0GCtz5KddKkAZ2yPoShybDLWC";
const password = "admin123";

bcrypt.compare(password, hash).then(match => {
  console.log("¿Coincide?", match); // debe mostrar true
});

// arduino_simple.ino
// Código súper simple: recibe cualquier mensaje y responde "Hola arduino"

void setup() {
  // Iniciar comunicación serial
  Serial.begin(9600);
  
  // Mensaje de inicio
  Serial.println("Arduino listo!");
}

void loop() {
  // Si llega cualquier mensaje por serial
  if (Serial.available() > 0) {
    
    // Leer el mensaje (aunque no lo usemos)
    String mensaje = Serial.readString();
    
    // Siempre responder lo mismo
    Serial.println("Hola arduino");
    
    // Limpiar buffer
    while(Serial.available() > 0) {
      Serial.read();
    }
  }
  
  delay(100);  // Pequeña pausa
}
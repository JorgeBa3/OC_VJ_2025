# servidor_simple.py
import serial
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Conectar al Arduino
try:
    arduino = serial.Serial('COM12', 9600, timeout=1)
    time.sleep(2)
    print("✅ Arduino conectado en COM12")
except:
    print("❌ No se pudo conectar al Arduino")
    arduino = None

@app.route('/enviar', methods=['POST'])
def enviar_mensaje():
    if not arduino:
        return jsonify({"error": "Arduino no conectado"})
    
    try:
        # Obtener mensaje del frontend
        mensaje = request.json.get('mensaje', '')
        print(f"📤 Enviando: {mensaje}")
        
        # Enviar cualquier cosa al Arduino
        arduino.write(mensaje.encode())
        time.sleep(0.1)
        
        # Leer respuesta del Arduino
        respuesta = arduino.readline().decode().strip()
        print(f"📥 Arduino respondió: {respuesta}")
        
        return jsonify({
            "enviado": mensaje,
            "respuesta": respuesta,
            "estado": "ok"
        })
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    print("🚀 Servidor iniciado en http://localhost:5000")
    app.run(debug=False, port=5000)
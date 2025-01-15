from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from werkzeug.utils import secure_filename
from animal_food_checker import AnimalFoodChecker

app = Flask(__name__)
CORS(app)

checker = AnimalFoodChecker()

@app.route('/api/check-barcode', methods=['POST'])
def check_barcode():
    data = request.json
    barcode = data.get('barcode')
    animal = data.get('animal')

    if not barcode or not animal:
        return jsonify({'error': 'Barcode et type d\'animal requis'}), 400

    result = checker.verifier_compatibilite(barcode, animal)
    return jsonify({'result': result})

@app.route('/api/scan-image', methods=['POST'])
def scan_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Aucune image fournie'}), 400

    file = request.files['image']
    animal = request.form.get('animal')

    if not animal:
        return jsonify({'error': 'Type d\'animal requis'}), 400

    if file.filename == '':
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400

    # Créer un fichier temporaire pour sauvegarder l'image
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, secure_filename(file.filename))
    file.save(temp_path)

    try:
        barcode, error = checker.scan_barcode_from_image(temp_path)
        if error:
            return jsonify({'error': error}), 400

        result = checker.verifier_compatibilite(barcode, animal)
        return jsonify({'result': result, 'barcode': barcode})

    finally:
        # Nettoyer les fichiers temporaires
        os.remove(temp_path)
        os.rmdir(temp_dir)

if __name__ == '__main__':
    app.run(debug=True)
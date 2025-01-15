import requests
import json
from pyzbar.pyzbar import decode
from PIL import Image

class AnimalFoodChecker:
    def __init__(self):
        self.animal_restrictions = {
            "chat": {
                "ingredients_interdits": ["chocolate", "theobromine", "caffeine", "coffee", "tea", "alcohol", "ethanol", "onions", "garlic", "chives", "leeks", "grapes", "raisins", "sultanas", "currants", "macadamia nuts", "avocado", "persin", "raw eggs", "raw meat", "raw fish", "bones", "fat trimmings", "yeast dough", "xylitol", "artificial sweeteners", "milk", "cream", "cheese", "dairy products", "mushrooms", "salt", "sodium", "sugary foods", "fatty foods"],
                "allergenes_interdits": ["milk"],
                "nutriments_max": {"salt": 2, "sugar": 5},
            },
            "chien": {
                "ingredients_interdits": ["chocolate", "cacao", "theobromine", "xylitol", "artificial sweeteners", "alcohol", "ethanol", "caffeine", "coffee", "tea", "onions", "garlic", "leeks", "chives", "grapes", "raisins", "sultanas", "currants", "macadamia nuts", "avocado", "persin", "raw yeast dough", "moldy foods", "mycotoxins", "fried foods", "fatty foods", "milk", "cream", "cheese", "dairy products"],
                "allergenes_interdits": [],
                "nutriments_max": {"salt": 3, "sugar": 10},
            },
            "lapin": {
                "ingredients_interdits": ["yogurt drops", "bread", "pasta", "cookies", "crackers", "avocado", "cereal", "muesli", "iceberg lettuce", "silverbeet", "chard", "hamster food", "walnuts", "oatmeal", "chocolate", "peanut butter", "potatoes", "rhubarb", "meat", "cauliflower"],
                "allergenes_interdits": ["eggs"],
                "nutriments_max": {"sugar": 2},
            }
        }

    def scan_barcode_from_image(self, image_path):
        try:
            image = Image.open(image_path)
            decoded_objects = decode(image)

            if not decoded_objects:
                return None, "Aucun code-barres détecté dans l'image"

            barcode = decoded_objects[0].data.decode('utf-8')
            return barcode, None

        except Exception as e:
            return None, f"Erreur lors de la lecture de l'image: {str(e)}"

    def get_product_info(self, barcode):
        # Try Open Food Facts first
        off_url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(off_url)
        if response.status_code == 200 and response.json().get("status") == 1:
            return response.json(), "OFF"

        # If not found, try Open Pet Food Facts
        opff_url = f"https://world.openpetfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(opff_url)
        if response.status_code == 200 and response.json().get("status") == 1:
            return response.json(), "OPFF"

        return None, None

    def analyser_ingredients(self, ingredients, animal):
        ingredients_lower = [ing.lower().strip() for ing in ingredients]
        ingredients_interdits = self.animal_restrictions[animal]["ingredients_interdits"]

        problemes = []
        for ingredient in ingredients_interdits:
            if any(ingredient in ing for ing in ingredients_lower):
                problemes.append(f"Contient {ingredient}")
        return problemes


    def analyser_nutriments(self, nutriments, animal):
        problemes = []
        limites = self.animal_restrictions[animal]["nutriments_max"]

        nutriment_mapping = {
            "salt": ["salt_100g", "sodium_100g"],
            "sugar": ["sugars_100g", "sugar_100g"]
        }

        for nutriment, limite in limites.items():
            keys = nutriment_mapping.get(nutriment, [nutriment])
            for key in keys:
                if key in nutriments and nutriments[key] > limite:
                    problemes.append(f"{nutriment} trop élevé ({nutriments[key]}g > {limite}g)")
                    break
        return problemes


    def verifier_compatibilite(self, barcode, animal):
        if animal.lower() not in self.animal_restrictions:
            return f"Animal {animal} non reconnu. Animaux supportés: {', '.join(self.animal_restrictions.keys())}"

        produit, source = self.get_product_info(barcode)
        if not produit:
            return "Produit non trouvé dans Open Food Facts ni dans Open Pet Food Facts"

        product_data = produit["product"]
        problemes = []

        if "ingredients_text" in product_data:
            ingredients = product_data["ingredients_text"].split(',')
            print(f"Ingredients ({source}):", ingredients)
            problemes.extend(self.analyser_ingredients(ingredients, animal.lower()))

        if "nutriments" in product_data:
            problemes.extend(self.analyser_nutriments(product_data["nutriments"], animal.lower()))

        nom_produit = product_data.get("product_name", "Produit inconnu")
        source_info = "" if source == "OPFF" else ""

        if not problemes:
            return f"✅ {nom_produit} {source_info} peut être consommé par votre {animal}"
        else:
            return f"❌ {nom_produit} {source_info} ne devrait PAS être donné à votre {animal}:\n" + "\n".join(f"- {p}" for p in problemes)

def main():
    checker = AnimalFoodChecker()

    while True:
        print("\n=== Vérificateur d'aliments pour animaux ===")
        animal = input("Entrez le type d'animal (chat/chien/lapin) ou 'q' pour quitter: ")

        if animal.lower() == 'q':
            break

        if animal.lower() not in checker.animal_restrictions:
            print(f"Animal non reconnu. Choix possibles: {', '.join(checker.animal_restrictions.keys())}")
            continue

        choix = input("Voulez-vous scanner une image (1) ou entrer le code-barres manuellement (2)? ")

        if choix == "1":
            image_path = input("Entrez le chemin de l'image du code-barres: ")
            barcode, error = checker.scan_barcode_from_image(image_path)
            if error:
                print(f"Erreur: {error}")
                continue
            print(f"Code-barres détecté: {barcode}")
        else:
            barcode = input("Entrez le code-barres du produit: ")

        resultat = checker.verifier_compatibilite(barcode, animal)
        print("\n" + resultat)

if __name__ == "__main__":
    main()
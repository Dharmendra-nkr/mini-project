"""Generate 500 realistic guest profiles and insert into PostgreSQL."""
import random
import string
import psycopg2
from datetime import date, timedelta

# Connection
conn = psycopg2.connect(
    host="localhost", port=5432, dbname="mini",
    user="postgres", password="12345"
)
cur = conn.cursor()

FIRST_NAMES = [
    "Aarav","Aditi","Akash","Ananya","Arjun","Bhavya","Chitra","Deepak","Divya","Esha",
    "Farhan","Gauri","Harsh","Isha","Jai","Kavya","Lakshmi","Manish","Neha","Om",
    "Priya","Rahul","Sanya","Tanvi","Uday","Varun","Yash","Zara","Aisha","Rohan",
    "James","Emma","Liam","Olivia","Noah","Ava","William","Sophia","Benjamin","Isabella",
    "Lucas","Mia","Henry","Charlotte","Alexander","Amelia","Sebastian","Harper","Jack","Evelyn",
    "Michael","Sarah","David","Jennifer","Robert","Jessica","Daniel","Emily","Matthew","Ashley",
    "Carlos","Maria","Luis","Ana","Jorge","Sofia","Pedro","Valentina","Diego","Camila",
    "Hans","Anna","Klaus","Greta","Friedrich","Helga","Wolfgang","Ingrid","Dieter","Monika",
    "Yuki","Sakura","Hiroshi","Aiko","Kenji","Hana","Takeshi","Mei","Ryu","Yumi",
    "Wei","Ling","Chen","Xiao","Ming","Fang","Jun","Hui","Tao","Yan",
    "Mohammed","Fatima","Ali","Aisha","Omar","Layla","Hassan","Noor","Ibrahim","Yasmin",
    "Pierre","Marie","Jean","Colette","Louis","Claire","Antoine","Sophie","François","Elise",
    "Giovanni","Giulia","Marco","Francesca","Lorenzo","Elena","Antonio","Chiara","Luca","Valentina",
    "Olaf","Astrid","Erik","Sigrid","Lars","Freya","Bjorn","Ingrid","Sven","Liv",
    "Patrick","Siobhan","Sean","Ciara","Declan","Niamh","Cormac","Aoife","Brendan","Roisin"
]

LAST_NAMES = [
    "Sharma","Patel","Gupta","Singh","Kumar","Reddy","Nair","Iyer","Rao","Desai",
    "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
    "Anderson","Taylor","Thomas","Moore","Jackson","Martin","Thompson","White","Harris","Clark",
    "Müller","Schmidt","Weber","Fischer","Meyer","Wagner","Becker","Schulz","Hoffmann","Koch",
    "Tanaka","Sato","Suzuki","Takahashi","Watanabe","Yamamoto","Nakamura","Kobayashi","Kato","Yoshida",
    "Wang","Li","Zhang","Liu","Chen","Yang","Huang","Wu","Zhou","Xu",
    "Kim","Lee","Park","Choi","Jung","Kang","Cho","Yoon","Jang","Han",
    "Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco",
    "Dubois","Laurent","Moreau","Bernard","Lefevre","Fournier","Roux","Girard","Bonnet","Dupont",
    "Johansson","Andersson","Nilsson","Eriksson","Larsson","Olsson","Persson","Svensson","Lindberg","Berg",
    "Al-Rashid","Al-Farsi","Khalil","Mansour","Haddad","Abbas","Saleh","Nasser","Qureshi","Mirza",
    "O''Brien","Murphy","Kelly","Ryan","Sullivan","Walsh","Byrne","Doyle","McCarthy","Fitzgerald"
]

NATIONALITIES = [
    "Indian","Indian","Indian","Indian","Indian",  # weighted towards Indian
    "American","American","American",
    "British","British",
    "German","German",
    "Japanese","Japanese",
    "Chinese","Chinese",
    "Australian","Australian",
    "French","French",
    "Italian",
    "Korean",
    "Canadian",
    "Swedish",
    "Dutch",
    "Brazilian",
    "Mexican",
    "Russian",
    "Thai",
    "Emirati",
    "Saudi",
    "Swiss",
    "Spanish",
    "Irish",
    "South African",
    "Singaporean",
    "Malaysian",
    "Indonesian",
    "Filipino",
    "New Zealander"
]

PREFERENCES_POOL = {
    "view": ["ocean", "garden", "pool", "sunset", "marina", "any"],
    "floor": ["high", "low", "middle", "any"],
    "bed_type": ["king", "twin", "queen"],
    "dietary": ["vegetarian", "vegan", "non-veg", "gluten-free", "halal", "kosher", "none"],
    "interests": ["spa", "diving", "surfing", "yoga", "golf", "fishing", "photography", "wine_tasting", "cooking_class", "jet_ski", "snorkeling", "sailing"],
    "quiet_room": [True, False],
    "smoking": [False, False, False, True],  # mostly non-smoking
    "pet_friendly": [False, False, False, True],
}

LOYALTY_TIERS = ["bronze"] * 50 + ["silver"] * 30 + ["gold"] * 15 + ["platinum"] * 5

DOMAINS = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","proton.me","mail.com","zoho.com"]

used_emails = set()

def gen_email(first, last, i):
    clean_last = last.lower().replace("'", "")
    base = f"{first.lower()}.{clean_last}"
    domain = random.choice(DOMAINS)
    email = f"{base}@{domain}"
    if email in used_emails:
        email = f"{base}{random.randint(1,999)}@{domain}"
    if email in used_emails:
        email = f"{base}{i}@{domain}"
    used_emails.add(email)
    return email

def gen_phone(nationality):
    if nationality == "Indian":
        return f"+91 {random.randint(70000,99999)}{random.randint(10000,99999)}"
    elif nationality == "American":
        return f"+1 {random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"
    elif nationality == "British":
        return f"+44 {random.randint(7000,7999)} {random.randint(100000,999999)}"
    else:
        return f"+{random.randint(1,99)} {random.randint(100000000,999999999)}"

def gen_preferences():
    import json
    prefs = {}
    prefs["view"] = random.choice(PREFERENCES_POOL["view"])
    prefs["floor"] = random.choice(PREFERENCES_POOL["floor"])
    prefs["bed_type"] = random.choice(PREFERENCES_POOL["bed_type"])
    prefs["dietary"] = random.choice(PREFERENCES_POOL["dietary"])
    prefs["interests"] = random.sample(PREFERENCES_POOL["interests"], random.randint(1, 4))
    prefs["quiet_room"] = random.choice(PREFERENCES_POOL["quiet_room"])
    prefs["smoking"] = random.choice(PREFERENCES_POOL["smoking"])
    return json.dumps(prefs)

print("Generating 500 guests...")
guests = []
for i in range(500):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    nationality = random.choice(NATIONALITIES)
    email = gen_email(first, last, i)
    phone = gen_phone(nationality)
    id_type = random.choice(["passport", "driver_license", "national_id", "aadhar"])
    id_num = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    dob = date(random.randint(1960, 2004), random.randint(1, 12), random.randint(1, 28))
    prefs = gen_preferences()
    loyalty = random.choice(LOYALTY_TIERS)
    total_stays = {"bronze": random.randint(0, 2), "silver": random.randint(2, 5), "gold": random.randint(5, 12), "platinum": random.randint(10, 30)}[loyalty]
    created = date(2025, random.randint(1, 12), random.randint(1, 28))

    guests.append((first, last, email, phone, nationality, id_type, id_num, dob, prefs, loyalty, total_stays, created))

cur.executemany("""
    INSERT INTO guests (first_name, last_name, email, phone, nationality, id_proof_type, id_proof_number, date_of_birth, preferences, loyalty_tier, total_stays, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", guests)

conn.commit()
print(f"Inserted {len(guests)} guests.")

cur.execute("SELECT COUNT(*) FROM guests;")
print(f"Total guests in DB: {cur.fetchone()[0]}")

cur.close()
conn.close()

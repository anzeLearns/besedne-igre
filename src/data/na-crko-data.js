function entry(word, difficulty) {
  return { word: word.toLocaleUpperCase("sl-SI"), difficulty };
}

function entries(words, difficulty) {
  return words.map((word) => entry(word, difficulty));
}

const WORDS = {
  hrana: {
    easy: [
      "ananas", "banana", "bučka", "čaj", "čebula", "fižol", "goba", "grah", "hruška", "jabolko",
      "jogurt", "kava", "korenje", "kruh", "limona", "med", "mleko", "olje", "oreh", "paprika",
      "pica", "piškot", "riba", "riž", "sir", "sol", "sok", "šunka", "torta", "voda",
      "zelje", "žemlja", "juha", "kaša", "kivi", "krompir", "maslo", "meso", "repa", "sliva"
    ],
    medium: [
      "ajvar", "avokado", "borovnica", "brokoli", "cvetača", "česen", "čips", "čufti", "dvopek", "golaž",
      "govedina", "hrenovka", "jota", "klobasa", "kumarica", "lešnik", "lazanja", "marmelada", "marelica", "nektarina",
      "omaka", "pašteta", "pečenka", "pomaranča", "prepečenec", "radič", "rezanci", "salama", "sendvič", "skuta",
      "sladoled", "smetana", "špinača", "testenine", "vanilija", "zavitek", "zelenjava", "žganci"
    ],
    hard: [
      "ajdovi žganci", "baklava", "brancin", "brstični ohrovt", "bučno olje", "carski praženec", "čemaž", "črni kruh",
      "dagnje", "dušeno zelje", "gobova juha", "hobotnica", "idrijski žlikrofi", "jagenjček", "kajmak", "kisla repa",
      "kislo mleko", "kranjska klobasa", "kremna rezina", "kuskus", "lečina enolončnica", "losos", "matevž",
      "nadevana paprika", "ocvrti sir", "pehtranova potica", "pirin kruh", "polnjeni lignji", "prekmurska gibanica",
      "račja prsa", "ričet", "sirovi štruklji", "skuša", "sojina omaka", "šparglji", "tatar omaka", "telečja obara",
      "tunina solata", "vampi", "zajčja obara", "zeliščni namaz", "žolca"
    ]
  },
  zival: {
    easy: [
      "bik", "čebela", "črv", "gos", "golob", "hrček", "jelen", "jež", "kača", "konj",
      "koza", "krava", "krt", "kuna", "labod", "lev", "lisica", "mačka", "medved", "miš",
      "muha", "orel", "osel", "ovca", "pajek", "papiga", "pes", "petelin", "polž", "puran",
      "rak", "riba", "ris", "slon", "sova", "srna", "tiger", "vidra", "volk", "zajec",
      "žaba", "želva"
    ],
    medium: [
      "aligator", "antilopa", "bober", "čaplja", "čmrlj", "delfin", "deževnik", "fazan", "galeb", "gams",
      "gepard", "gorila", "hijena", "igvana", "jazbec", "jastreb", "kanarček", "kameleon", "kenguru", "koala",
      "kobilica", "komar", "krokodil", "lastovka", "lemur", "morski pes", "mravlja", "nosorog", "panda", "pingvin",
      "postrv", "sardela", "sraka", "svizec", "šakal", "štorklja", "tjulenj", "veverica", "vodomec", "zebra",
      "žirafa", "žolna"
    ],
    hard: [
      "akvarijska riba", "beloglavi jastreb", "belouška", "brkata sinica", "črna štorklja", "domači prašič",
      "evrazijski ris", "glavata kareta", "gozdna sova", "hribski škrjanec", "indijski slon", "istrski osel",
      "jadranska sardela", "kozorog", "kraški ovčar", "mala podlasica", "močerad", "morska zvezda", "navadni jelen",
      "navadni močerad", "navadna postrv", "planinski orel", "planinski močerad", "poljski zajec", "pritlikavi kunec",
      "rdeča lisica", "rečna vidra", "rjavi medved", "rumena pastirica", "sivi volk", "sladkovodni rak", "smrdokavra",
      "stepski dihur", "šarenka", "velika uharica", "vodna želva", "zelena rega", "zlati šakal"
    ]
  },
  predmet: {
    easy: [
      "barvica", "blazina", "brisača", "čevlji", "čopič", "dežnik", "denarnica", "glavnik", "gumb", "igla",
      "kapa", "ključ", "knjiga", "kocka", "kolo", "koš", "kozarec", "lonček", "lonec", "luč",
      "majica", "metla", "milo", "miza", "nogavica", "nož", "odeja", "papir", "pisalo", "ravnilo",
      "skleda", "slika", "stol", "svinčnik", "telefon", "torba", "ura", "vaza", "vilica", "zvezek",
      "žlica", "žoga"
    ],
    medium: [
      "baterija", "brivnik", "budilka", "čelada", "čistilo", "daljinec", "dnevnik", "flomaster", "fotoaparat", "grelnik",
      "hladilnik", "kladivo", "koledar", "kovček", "kuhalnica", "kuverta", "ležalnik", "likalnik", "nahrbtnik", "obešalnik",
      "ogledalo", "paket", "pisalna miza", "podaljšek", "polnilec", "postelja", "predal", "računalnik", "rokavica", "sesalnik",
      "skodelica", "stikalo", "steklenica", "svetilka", "škarje", "štedilnik", "tipkovnica", "vijak", "vrtalnik", "zalivalka",
      "zapestnica", "zobna ščetka", "zvočnik", "žarnica"
    ],
    hard: [
      "bliskovni pogon", "brusilni papir", "čistilna krpa", "daljnogled", "domači tiskalnik", "električna krtačka",
      "električni grelnik", "gasilni aparat", "gramofonska plošča", "hidravlična dvigalka", "izvijač", "keramična posoda",
      "klimatska naprava", "kovinska sponka", "kuhinjska tehtnica", "laserski tiskalnik", "merilni trak", "mikrovalovna pečica",
      "nakupovalna vrečka", "namizna svetilka", "obesek za ključe", "odpirač za steklenice", "otroški voziček",
      "papirnata brisača", "pisarniški stol", "plastična posoda", "pomivalni stroj", "prenosni računalnik", "razdelilna letev",
      "rezalna deska", "rezervni ključ", "ročni mešalnik", "sedežna blazina", "senzorska luč", "stekleni kozarec",
      "sušilni stroj", "šivalni stroj", "športna torba", "termovka", "varnostni pas", "vodna tehtnica", "vrtna cev",
      "zaščitna očala", "žepni nož"
    ]
  },
  mesto: {
    easy: [
      "ljubljana", "maribor", "celje", "kranj", "koper", "bled", "piran", "ptuj", "izola", "velenje"
    ],
    medium: [
      "domžale", "kamnik", "novo mesto", "murska sobota", "nova gorica", "trbovlje", "jesenice", "škofja loka",
      "slovenj gradec"
    ],
    hard: [
      "idrija", "sežana", "tolmin", "kočevje", "črnomelj", "lendava", "žalec", "radovljica", "ilirska bistrica"
    ]
  },
  poklic: {
    easy: [
      "brivec", "čistilec", "dostavljavec", "elektrikar", "fotograf", "frizer", "gasilec", "gozdar", "hišnik",
      "kmet", "knjigar", "krojač", "kuhar", "lesar", "mesar", "mizar", "natakar", "novinar", "pek",
      "pekar", "pleskar", "policaj", "poštar", "prodajalec", "receptor", "ribič", "serviser", "slikar", "sobarica",
      "sodnik", "šofer", "šivilja", "tajnik", "tesar", "trener", "trgovec", "učitelj", "uradnik", "varnostnik",
      "varuška", "veterinar", "voznik", "vrtnar", "zdravnik", "zidar", "zobozdravnik", "župan"
    ],
    medium: [
      "analitik", "arhitekt", "avtomehanik", "bančnik", "biolog", "bolničar", "carinik", "cvetličar", "čevljar",
      "diplomat", "dimnikar", "ekonomist", "električar", "farmacevt", "geodet", "grafik", "inženir", "kemik",
      "knjižničar", "laborant", "lektor", "logoped", "mehanik", "monter", "oblikovalec", "odvetnik", "optik",
      "pedagog", "prevajalec", "programer", "psiholog", "računovodja", "redar", "rudar", "skrbnik", "slaščičar",
      "snemalec", "svetovalec", "tehnik", "tolmač", "urednik", "upravnik", "vulkanizer", "vzgojitelj",
      "zobotehnik", "železničar"
    ],
    hard: [
      "aktuarski analitik", "anesteziolog", "arheolog", "avdiolog", "biokemik", "čebelarski mojster", "dermatolog",
      "družinski terapevt", "elektroinženir", "energetski svetovalec", "farmacevtski tehnik", "fizioterapevt",
      "geoinformatik", "gozdarski inženir", "hidrolog", "ilustrator", "izvršitelj", "kardiolog", "kemijski tehnolog",
      "klinični psiholog", "konservator", "kriminalist", "letalski mehanik", "medicinski biokemik", "mikrobiolog",
      "nepremičninski posrednik", "nevrolog", "okoljski inženir", "ortodont", "pediater", "projektant", "radiolog",
      "restavrator", "revizor", "scenograf", "sistemski administrator", "sodni izvedenec", "specialni pedagog",
      "strojni inženir", "športni fizioterapevt", "urbanist", "varnostni inženir", "veterinarski tehnik",
      "vodja gradbišča", "zdravstveni tehnik", "zobni asistent"
    ]
  }
};

const COUNTRIES = {
  easy: [
    "Albanija", "Avstrija", "Belgija", "Češka", "Danska", "Egipt", "Finska", "Francija", "Grčija", "Hrvaška",
    "Indija", "Irska", "Islandija", "Italija", "Kanada", "Kitajska", "Madžarska", "Mehika", "Nemčija", "Norveška",
    "Poljska", "Romunija", "Slovaška", "Slovenija", "Srbija", "Španija", "Švedska", "Turčija", "Ukrajina"
  ],
  medium: [
    "Argentina", "Armenija", "Avstralija", "Belorusija", "Bolgarija", "Bosna in Hercegovina", "Brazilija", "Ciper",
    "Čile", "Estonija", "Filipini", "Gruzija", "Indonezija", "Iran", "Izrael", "Japonska", "Južna Afrika",
    "Kolumbija", "Latvija", "Litva", "Luksemburg", "Maroko", "Moldavija", "Nizozemska", "Nova Zelandija",
    "Pakistan", "Portugalska", "Severna Makedonija", "Švica", "Tajska", "Tunizija", "Vietnam",
    "Združene države Amerike", "Združeno kraljestvo"
  ],
  hard: [
    "Afganistan", "Alžirija", "Andora", "Angola", "Antigva in Barbuda", "Azerbajdžan", "Bahami", "Bahrajn",
    "Bangladeš", "Barbados", "Belize", "Benin", "Bocvana", "Bolivija", "Brunej", "Burkina Faso", "Burundi",
    "Butan", "Čad", "Črna gora", "Demokratična republika Kongo", "Dominika", "Dominikanska republika", "Džibuti",
    "Ekvador", "Ekvatorialna Gvineja", "Eritreja", "Esvatini", "Etiopija", "Fidži", "Gabon", "Gambija",
    "Gana", "Grenada", "Gvajana", "Gvatemala", "Gvineja", "Gvineja Bissau", "Haiti", "Honduras", "Irak",
    "Jamajka", "Jemen", "Jordanija", "Južna Koreja", "Južni Sudan", "Kambodža", "Kamerun", "Katar",
    "Kazahstan", "Kenija", "Kirgizistan", "Kiribati", "Komori", "Kosovo", "Kostarika", "Kuba", "Kuvajt",
    "Laos", "Lesoto", "Libanon", "Liberija", "Libija", "Lihtenštajn", "Madagaskar", "Malavi", "Maldivi",
    "Malezija", "Mali", "Malta", "Maršalovi otoki", "Mavretanija", "Mavricij", "Mikronezija", "Mjanmar",
    "Monako", "Mongolija", "Mozambik", "Namibija", "Nauru", "Nepal", "Niger", "Nigerija", "Nikaragva",
    "Oman", "Palau", "Palestina", "Panama", "Papua Nova Gvineja", "Paragvaj", "Peru", "Republika Kongo",
    "Ruanda", "Rusija", "Salomonovi otoki", "Salvador", "Samoa", "San Marino", "Sao Tome in Principe",
    "Savdska Arabija", "Sejšeli", "Senegal", "Severna Koreja", "Sierra Leone", "Singapur", "Sirija",
    "Slonokoščena obala", "Somalija", "Srednjeafriška republika", "Sudan", "Surinam", "Sveta Lucija",
    "Sveti Krištof in Nevis", "Sveti Vincencij in Grenadine", "Šrilanka", "Tadžikistan", "Tanzanija", "Togo",
    "Tonga", "Trinidad in Tobago", "Turkmenistan", "Tuvalu", "Uganda", "Urugvaj", "Uzbekistan", "Vanuatu",
    "Vatikan", "Venezuela", "Vzhodni Timor", "Zambija", "Združeni arabski emirati", "Zelenortski otoki",
    "Zimbabve"
  ]
};

export const naCrkoCategories = [
  {
    id: "hrana",
    label: "Hrana",
    icon: "🍔",
    answers: [
      ...entries(WORDS.hrana.easy, "easy"),
      ...entries(WORDS.hrana.medium, "medium"),
      ...entries(WORDS.hrana.hard, "hard")
    ]
  },
  {
    id: "zival",
    label: "Žival",
    icon: "🐾",
    answers: [
      ...entries(WORDS.zival.easy, "easy"),
      ...entries(WORDS.zival.medium, "medium"),
      ...entries(WORDS.zival.hard, "hard")
    ]
  },
  {
    id: "predmet",
    label: "Predmet",
    icon: "🧩",
    answers: [
      ...entries(WORDS.predmet.easy, "easy"),
      ...entries(WORDS.predmet.medium, "medium"),
      ...entries(WORDS.predmet.hard, "hard")
    ]
  },
  {
    id: "drzava",
    label: "Država",
    icon: "🌍",
    answers: [
      ...entries(COUNTRIES.easy, "easy"),
      ...entries(COUNTRIES.medium, "medium"),
      ...entries(COUNTRIES.hard, "hard")
    ]
  },
  {
    id: "poklic",
    label: "Poklic",
    icon: "💼",
    answers: [
      ...entries(WORDS.poklic.easy, "easy"),
      ...entries(WORDS.poklic.medium, "medium"),
      ...entries(WORDS.poklic.hard, "hard")
    ]
  },
  {
    id: "mesto",
    label: "Kraj",
    icon: "🏙️",
    answers: [
      ...entries(WORDS.mesto.easy, "easy"),
      ...entries(WORDS.mesto.medium, "medium"),
      ...entries(WORDS.mesto.hard, "hard")
    ]
  }
];

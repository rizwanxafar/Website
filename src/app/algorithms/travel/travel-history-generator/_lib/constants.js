import { clsx } from 'clsx';
import { Country } from "country-state-city";

export const CSC_COUNTRIES = Country.getAllCountries();

export const ACCOMMODATION_OPTIONS = [
  'Hotel/Resort', 'Hostel', 'Homestay', 'Friends/Family home', 'Rural camp', 'Safari camp',
  'Refugee camp', 'Healthcare facility residence', 'Other',
];

export const VACCINE_SUGGESTIONS = [
  'Yellow fever', 'Hepatitis A', 'Hepatitis B', 'Typhoid', 'Meningitis ACWY',
  'Rabies', 'Cholera', 'Japanese encephalitis', 'Tick-borne encephalitis', 'Polio booster', 'Tetanus booster'
];

export const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine', 'Unknown'];
export const MALARIA_STATUS_OPTIONS = ['Not indicated', 'Taken', 'Not taken', 'Unsure'];
export const VACCINE_STATUS_OPTIONS = ['Taken', 'Not taken', 'Unsure']; 
export const ADHERENCE_OPTIONS = ['Good', 'Partial', 'Poor', 'Unknown'];

export const COMPANION_GROUPS = ['Alone', 'Family', 'Friends', 'Other'];
export const COMPANION_WELL_OPTIONS = ['Yes', 'No', 'Unknown'];

export const EXPOSURE_CATEGORIES = [
  {
    title: "Vector-borne",
    items: [
      { key: 'mosquito', label: 'Mosquito bites' },
      { key: 'tick', label: 'Tick bites' },
      { key: 'vectorOtherEnabled', label: 'Other vector' }
    ]
  },
  {
    title: "Water / Environment",
    items: [
      { key: 'freshwater', label: 'Swimming or wading in fresh water' },
      { key: 'cavesMines', label: 'Visited caves or mines' },
      { key: 'ruralForest', label: 'Rural / forest stay' },
      { key: 'hikingWoodlands', label: 'Hiking in forest/woodlands' }
    ]
  },
  {
    title: "Animal & Procedures",
    items: [
      { key: 'animalContact', label: 'Animal contact' },
      { key: 'animalBiteScratch', label: 'Animal bite / scratch' },
      { key: 'batsRodents', label: 'Contact with bats or rodents' },
      { key: 'bushmeat', label: 'Bushmeat consumption' },
      { key: 'needlesTattoos', label: 'Needles / tattoos / piercings' },
      { key: 'safariWildlife', label: 'Safari / wildlife viewing' }
    ]
  },
  {
    title: "Food & Water",
    items: [
      { key: 'streetFood', label: 'Street food' },
      { key: 'untreatedWater', label: 'Drank untreated water' },
      { key: 'undercookedFood', label: 'Undercooked food' },
      { key: 'undercookedSeafood', label: 'Undercooked seafood' },
      { key: 'unpasteurisedMilk', label: 'Unpasteurised milk' }
    ]
  },
  {
    title: "Institutional / Social",
    items: [
      { key: 'funerals', label: 'Attended funerals' },
      { key: 'sickContacts', label: 'Close contact with unwell people (e.g., cough, fever)' },
      { key: 'healthcareFacility', label: 'Healthcare facility contact' },
      { key: 'prison', label: 'Prison contact' },
      { key: 'refugeeCamp', label: 'Refugee camp contact' },
      { key: 'unprotectedSex', label: 'Unprotected sex' }
    ]
  }
];

// --- Shared Tailwind Classes ---
export const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";

export const BTN_PRIMARY = clsx(BTN_BASE, 
  "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 focus:ring-[hsl(var(--brand))]/70 disabled:opacity-50 disabled:cursor-not-allowed"
);

export const BTN_SECONDARY = clsx(BTN_BASE,
  "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-slate-400"
);

export const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition text-slate-600 dark:text-slate-400";

export const INPUT_BASE = 
  "w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 dark:text-slate-100 bg-transparent focus:ring-0";

export const CONTAINER_BASE =
  "relative w-full cursor-default overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left focus-within:border-[hsl(var(--brand))] focus-within:ring-1 focus-within:ring-[hsl(var(--brand))] sm:text-sm transition-all";

export const TEXT_INPUT_CLASS = clsx(CONTAINER_BASE, "flex items-center");

export const TEXTAREA_CLASS = 
  "w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] transition";

export const SECTION_HEADING = "text-lg font-semibold text-slate-900 dark:text-slate-100";

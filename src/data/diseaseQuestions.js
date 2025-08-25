// src/data/diseaseQuestions.js
// Minimal UKHSA exposure questions (exactly the ones specified).

export const EXPOSURE_QUESTIONS = {
  GLOBAL_OUTBREAK: {
    id: "q1_outbreak",
    text:
      "Has the patient travelled to any area where there is a current VHF outbreak?",
  },
  GLOBAL_BLEEDING: {
    id: "q2_bleeding",
    text:
      "Does the patient have extensive bruising or active bleeding?",
  },
  LASSA_RURAL: {
    id: "q3_lassa_rural",
    diseases: ["Lassa fever"],
    text:
      "In this country, has the patient lived or worked in basic rural conditions?",
  },
  EBOV_MARB_ANIMAL: {
    id: "q4_ebov_marb_animals",
    diseases: ["Ebola", "Marburg"],
    text:
      "In this country, did the patient visit caves/mines, or have contact with primates, antelopes or bats (or eat their raw/undercooked meat)?",
  },
  CCHF_TICK_SLAUGHTER: {
    id: "q5_cchf_tick_slaughter",
    diseases: ["CCHF"],
    text:
      "In this country, did the patient sustain a tick bite or crush a tick with bare hands, OR have close involvement with animal slaughter?",
  },
};

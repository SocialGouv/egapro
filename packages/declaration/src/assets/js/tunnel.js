const form = document.getElementById("page-form");
const progress = document.querySelector("progress");
const previousButton = document.querySelector("a[rel=prev]");
const nextButton = document.querySelector("button[rel=next]");

const conditions = {
    isUES: (data) => data._entreprise?.structure === "ues",
    isPeriodeSuffisante: (data) => data.déclaration.période_suffisante,
    isCoef: (data) => data.indicateurs.rémunérations.mode === "niveau_branche" || data.indicateurs.rémunérations.mode === "niveau_autre",
    isCSP: (data) => data.indicateurs.rémunérations.mode === "csp",
    isTranche50_250: (data) => data.entreprise.effectif.tranche === "50:250",
    isCalculable: (data) => data.déclaration.points_calculables >= 75 || data.déclaration.année_indicateurs >= 2020
}

const steps = [
  { name: "commencer" },
  { name: "declarant" },
  { name: "perimetre",
    nextStep: (data) => conditions.isUES(data) ? "ues" : "informations"
  },
  { name: "ues" },
  { name: "informations",
      nextStep: (data) => !conditions.isPeriodeSuffisante(data) ? "validation" : "remuneration",
      backStep: (data) => conditions.isUES(data) ? "ues" : "perimetre"
  },
  { name: "remuneration",
    nextStep: (data) => conditions.isCoef(data)
        ? "remuneration-coef"
        : conditions.isCSP(data)
        ? "remuneration-csp"
        : conditions.isTranche50_250(data)
        ? "augmentations-et-promotions"
        : "augmentations"
  },
  { name: "remuneration-coef", nextStep: (_) => "remuneration-final" },
  { name: "remuneration-csp",
    nextStep: (_) => "remuneration-final",
    backStep: (_) => "remuneration"
  },
  { name: "remuneration-final",
    nextStep: (data) => conditions.isTranche50_250(data) ? "augmentations-et-promotions" : "augmentations",
    backStep: (data) => conditions.isCoef(data) ? "remuneration-coef" : "remuneration-csp"
  },
  // If tranche effectif is > 50:250
  { name: "augmentations",
    backStep: (data) => conditions.isCoef(data) || conditions.isCSP(data) ? "remuneration-final" : "remuneration"
  },
  { name: "promotions", nextStep: (_) => "maternite" },
  // If tranche effectif is 50:250
  { name: "augmentations-et-promotions",
    backStep: (data) => conditions.isCoef(data) || conditions.isCSP(data) ? "remuneration-final" : "remuneration"
  },
  //
  { name: "maternite",
    backStep: (data) => conditions.isTranche50_250(data) ? "augmentations-et-promotions" : "promotions"
  },
  { name: "hautes-remunerations" },
  { name: "note", nextStep: (data) => conditions.isCalculable(data) ? "resultat" : "validation" },
  { name: "resultat" },
  { name: "validation",
    backStep: (data) => !conditions.isPeriodeSuffisante(data)
        ? "informations"
        : conditions.isCalculable(data)
        ? "resultat"
        : "note"
  },
  { name: "transmission" },
];

const fileName =
  location.pathname.lastIndexOf("/") < 0
    ? location.pathname
    : location.pathname.split("/").pop();
const pageName = fileName.split(".")[0];
const step = steps.findIndex((step) => step.name === pageName);

document.addEventListener("ready", () => {
  if (!app.token) redirect("./")
  if (pageName !== 'commencer' && (!app.siren || !app.annee)) redirect("./commencer.html")
  loadFormValues(form);
  if (pageName !== 'commencer') {
    // The page "commencer" isn't really part of the tunnel, it's only its entrance:
    // we don't want to prevent a user from changing the year/siren and access another declaration.
    toggleDeclarationValidatedBar()
    if (app.mode === "reading") {
      // Fields cannot be edited
      document.querySelectorAll('[name]').forEach(input => {
        input.setAttribute('readonly', true)
        if(input.matches('[type=radio]:not(:checked)')) input.disabled = true
        if(input.matches('[type=checkbox]')) {
          input.saveOnClick = input.onclick
          input.onclick = (_) => false
        }
        if(input.matches('select')) {
          Array.from(input.querySelectorAll('option'))
            .filter(option => !option.selected)
            .forEach(option => option.disabled = true)
        }
      })
    }
  }
});

progress.max = steps.length - 1;
progress.value = step;

async function saveFormData (event) {
  event && event.preventDefault();

  const data = serializeForm(form);

  if (typeof document.onsend === "function") {
    try {
      await document.onsend(data);
    } catch (e) {
      return notify.error(e, data);
    }
  }

  return await app.save(data, event);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault()
  nextButton.setAttribute('disabled', 'disabled');
  if (typeof document.preFormSubmit === "function") {
    try {
      const result = await document.preFormSubmit(event)
      if (!result) {
        nextButton.removeAttribute('disabled');
        return false
      }
    } catch (e) {
      nextButton.removeAttribute('disabled');
      return notify.error(e)
    }
  }

  if(app.mode !== 'reading' && pageName !== 'commencer') {
    const response = await saveFormData(event);

    if (!response || !response.ok) {
      nextButton.removeAttribute('disabled');
      return;
    }
  }

  const nextStep = steps[step].nextStep;
  if (nextStep) return redirect(`${nextStep(app.data)}.html`);
  else return redirect(`${steps[step + 1].name}.html`);
});

const refreshForm = async (event) => {
  if (!event.target.checkValidity()) return

  let response = await saveFormData();

  if (!response.ok) return;

  response = await app.loadRemoteData();
  if (!response.ok) return;
  loadFormValues(form);
};

// "Previous" button
if (step > 0) {
  previousButton.onclick = (e) => {
    e.preventDefault();
    // history.back();
    const backStep = steps[step].backStep;
    if (backStep) return redirect(`${backStep(app.data)}.html`);
    else return redirect(`${steps[step - 1].name}.html`);
  };
} else {
  previousButton.onclick = (e) => {
    // On the "commencer.html" page (the first) we display a "nouvelle déclaration" button
    e.preventDefault()
    app.resetData()
    app.dataToLocalStorage()
    // Reload the page, without the local data
    redirect('./commencer.html')
  };
}

// "Next" button
if (step >= steps.length - 1) {
  nextButton.setAttribute("disabled", "disabled");
}

// Copie les données du form de la page courante, dans l'objet app.data.
// Supprime les propriétés qui sont undefined.
function serializeForm(form) {
  let data = app.data;

  // Only the fields that have names are of interest for us (not submit buttons)
  const allFields = Array.from(form.elements).filter((field) => field.name);

  const formData = new FormData(form);
  formData.forEach((value, key) => {
    if (!value) {
      return;
    }
    const field = allFields.find((node) => node.name === key);
    if (field.getAttribute("type") === "number") {
      value = Number(value);
    }
    app.setItem(key, value);
  });

  // Get all the names of the fields that aren't disabled (and thus included in FormData)
  const enabledFields = Array.from(formData).map(
    (formDataItem) => formDataItem[0]
  );

  // We need to force remove disabled fields that might have been set previously
  allFields.forEach((field) => {
    if (!enabledFields.includes(field.name) || field.value === "") {
      app.delItem(field.name);
    }
  });
  removeEmpty(data);
  return data;
}

function removeEmpty(data) {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "array") {
      if (!data[key].filter((item) => item !== undefined).length) {
        delete data[key];
      } else {
        removeEmpty(data[key]);
      }
    } else if (data[key] && typeof data[key] === "object") {
      if (!Object.keys(data[key]).length) {
        delete data[key];
      } else {
        removeEmpty(data[key]);
      }
    }
  });
}

function loadFormValues(form) {
  Array.from(form.elements).forEach((node) => {
    if (!node.name) return;
    const value = app.getItem(node.name);
    if (value === "") return;
    if (node.type === "radio") {
      node.checked = node.value === value;
    } else if (node.type === "checkbox") {
      node.checked = value === "oui"
    } else {
      // If it's a hidden input, it's one we generated, we don't want to overwrite it with an empty value
      node.value = node.type === "hidden" ? node.value : value;
    }
  });
}

function toggleDeclarationValidatedBar() {
    if (app.mode === "creating") return

    const dateDeclaration = new Date(app.getItem("déclaration.date"))
    let now = new Date();

    now.setFullYear(now.getFullYear() - 1);

    if (dateDeclaration < now) {
        // La date de déclaration est plus ancienne qu'il y a un an, on ne permet plus de modifier la déclaration.
        document.getElementById("declaration-frozen").hidden = false
        return
    }

    if(app.data.source === 'simulateur') {
        if (app.mode === "reading") {
            document.getElementById("simulation-readonly").hidden = false
        }
    } else {
        if (app.mode === "reading") {
            document.getElementById("declaration-readonly").hidden = false
        } else if (app.mode === "updating") {
            document.getElementById("declaration-draft").hidden = false
        }
    }

    const année = app.getItem("déclaration.année_indicateurs")
    const index = app.getItem("déclaration.index")

    // index may be undefined if it is Non calculable. Don't show the bar in this case.
    const objectifsMesuresIsVisible = année >= 2021 && index && index < 85
    const objectifsMesuresLabel = objectifsMesuresIsVisible && index < 75
        ? "Aller aux objectifs de progression et mesures de correction"
        : "Aller aux objectifs de progression"

    document.getElementById("objectifs-mesures-button").hidden = !objectifsMesuresIsVisible
    document.getElementById("objectifs-mesures-button").innerHTML = objectifsMesuresLabel
}


async function setDraftStatus() {
  if (confirm("Vous allez modifier une déclaration déjà validée et transmise.")) {
    app.isDraft = true
    toggleDeclarationValidatedBar()
    document.querySelectorAll('[name]').forEach(input => {
      if (input.hasAttribute('data-always-readonly')) {
        return
      }
      input.removeAttribute('readonly')
      if(input.matches('[type=radio]:not(:checked)')) input.removeAttribute('disabled')
      if(input.matches('[type=checkbox]')) input.onclick = input.saveOnClick
      if(input.matches('select')) {
        Array.from(input.querySelectorAll('option'))
          .filter(option => !option.selected)
          .forEach(option => option.removeAttribute('disabled'))
      }
    })
    nextButton.removeAttribute('disabled')
  }
}

function goToSimulationApp() {
  const id = app.data.id
  const simulation = window.open(`${location.origin}/index-egapro/simulateur/${id}`, '_blank');
  simulation.focus()
}


async function resendReceipt() {
  const response = await request('POST', `/declaration/${app.siren}/${app.annee}/receipt`)
  if (response.ok) {
    return notify.info("L'accusé de réception a été renvoyé à votre adresse email");
  } else {
    return notify.error("Erreur lors du renvoi de l'accusé de réception");
  }
}



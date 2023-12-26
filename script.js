const titles = [
  "UnB Supremacy",
  "Unicamp Lixo",
  "USP Lixo",
  "UFRJ Lixo",
  "UFMG Lixo",
  "UFRN Lixo",
  "UFAL Lixo",
  "¿¿Heladito??",
  "Is that Tiagobfs?",
  "Preto Branco Branco Preto Preto",
  "Edson vem pro darcy plmds",
  "O cara vai levar 3 cinza pra mundial mano...",
  "Frutos do Goiás",
  "Vamos pra Goiania?",
  "Gangue do sorvete de Maracujá",
  "Aprende a codar",
  "O cara tem 2 chaveiros no time",
  "Concorrente? Concorrente?",
  "Vamos amassar esses lixos",
  "Wrong answer on pretest 2",
  "Jogando como nunca, perdendo como sempre",
  "Ele é bom mas não é 3 porra",
  "Namoral que tu não gosta de geometria?",
];

function setRandomTitle() {
  const randomIndex = Math.floor(Math.random() * titles.length);
  const randomTitle = titles[randomIndex];
  document.getElementById('titleHeader').textContent = randomTitle;
  document.title = randomTitle;
}
window.onload = setRandomTitle;


async function fetchDataForHandle(handle) {
  try {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    throw new Error(`Status of the request is FAILED.`);
  } catch (error) {
    console.error(`Error fetching data for ${handle}:`, error);
    return [];
  }
}

async function commonProblems() {

  displayLoading();
  const userHandle = parseTextBox('user-handle');
  const handles = parseTextBoxComma('handles');
  const ratingRange = parseRating();
  const tags = parseTextBoxComma('tags');

  
  try {
    const submissionsFromUser = await fetchDataForHandle(userHandle);
    const acceptedProblemsFromUser = getAcceptedProblems(submissionsFromUser);
    
    const handlesDataPromises = handles.map(handle => fetchDataForHandle(handle));
    const submissionsFromHandles = await Promise.all(handlesDataPromises);

    const acceptedProblemsFromHandles = submissionsFromHandles.map(submissions => getAcceptedProblems(submissions));
    const acceptedProblemsFromHandlesFiltered = filterByRating(filterByTag(acceptedProblemsFromHandles, tags), ratingRange);
    const commonProblems = getCommonProblems(acceptedProblemsFromHandlesFiltered);

    displayCommonProblems(commonProblems, acceptedProblemsFromUser, submissionsFromUser);
  } catch (error) {
    console.error('Error getting common problems:', error);
  }
}

function getAcceptedProblems(submissions) {
  return removeDuplicates(
    submissions
      .filter(submission => submission.verdict === "OK")
      .map(submission => submission.problem)
  );
}

function getCommonProblems(acceptedProblemsFromHandles) { // Interssection of all users
  if (acceptedProblemsFromHandles.length === 0) {
    return [];
  }
  return acceptedProblemsFromHandles[0].filter(
    problemA =>
    acceptedProblemsFromHandles.every(
      problems => problems.some(problemB => JSON.stringify(problemA) === JSON.stringify(problemB))
    )
  );
}

function filterByRating(problemsByUser, ratingRange) {
  const [start, end] = ratingRange;
  return problemsByUser.map(
    problems =>
      problems.filter(
        problem =>
          problem.hasOwnProperty('rating') &&
          start <= problem.rating &&
          problem.rating <= end
      )
  );
}

function filterByTag(problemsByUser, tags) {
  if (tags.length === 0) {
    return problemsByUser;
  }
  return problemsByUser.map(
    problems =>
      problems.filter(
        problem =>
          problem.hasOwnProperty('tags') &&
          tags.every(tag => problem.tags.includes(tag))
      )
  );
}

// Display functions

function displayCommonProblems(problems, acceptedProblemsFromUser, submissionsFromUser) {
  const problemsList = document.getElementById('problems-list');
  problemsList.innerHTML = '';

  if (problems.length === 0) {
    problemsList.innerHTML = '<p>No common problems found.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.classList.add('problem-cards');

  problems.forEach(problem => {
    const li = document.createElement('li');
    
    if (acceptedProblemsFromUser.some(problemUser => JSON.stringify(problem) === JSON.stringify(problemUser))) {
      li.classList.add('problem-card-ac');
    } else if (submissionsFromUser.some(submission => JSON.stringify(problem) === JSON.stringify(submission.problem))) {
      li.classList.add('problem-card-wa');
    } else {
      li.classList.add('problem-card');
    }

    const cardContent = document.createElement('div');
    cardContent.classList.add('card-content');

    const problemLink = document.createElement('a');
    // no rating? gym problem
    let problemType = (problem.hasOwnProperty('rating') ? 'contest' : 'gym');
    problemLink.href = `https://codeforces.com/${problemType}/${problem.contestId}/problem/${problem.index}`;
    problemLink.textContent = `${problem.name}`;

    cardContent.appendChild(problemLink);
    li.appendChild(cardContent);
    ul.appendChild(li);
  });
  problemsList.appendChild(ul);
}

function displayLoading() {
  const problemsList = document.getElementById('problems-list');
  problemsList.innerHTML = '';
  problemsList.innerHTML = '<p>Loading...</p>';
}

// Aux functions

function removeDuplicates(arr) {
  return arr.filter(
    (obj, index, self) => index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(obj))
  );
}

function applyFilters(data, filters) {
  return filters.reduce((result, filter) => filter(result), data);
}

function parseTextBoxComma(label) {
  let values = document.getElementById(label).value.trim();
  if (values === '') return [];
  return values.split(',').map(name => name.trim());
}

function parseTextBox(label) {
  return document.getElementById(label).value.trim();
}

function parseRating() {
  let start = document.getElementById(`start-rating`).value.trim();
  let end = document.getElementById(`end-rating`).value.trim();
  start = (start === '' ? 0:Number(start));
  end = (end === '' ? 4000:Number(end));
  return [start, end];
}
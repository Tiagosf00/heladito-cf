const titles = [
  "UnB Supremacy",
  "Unicamp Lixo",
  "USP Lixo",
  "UFRJ Lixo",
  "UFMG Lixo",
  "UFRN Lixo",
  "UFAL Lixo",
  "UFCG Lixo",
  "UDESC Lixo",
  "UFPE Lixo",
  "IME Lixo",
  "¿¿Heladito??",
  "Is that Tiagobfs?",
  "Preto Branco Branco Preto Preto",
  "Edson vem pro darcy plmds",
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
  "Ele é bom e é três",
  "Namoral que tu não gosta de geometria?",
  "O cara é bom né, não tem o que fazer",
  "Transformou o cara em subset",
  "Lutar com lagartos gigantes na terra oca?",
  "Partiu recuperar nossa mundial perdida na terra oca",
  "Russia pague nossos 4.5kdol imediatamente"
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

async function fetchDataForHandlesSequentially(handles) {
  const submissions = [];

  for (const handle of handles) {
    try {
      const data = await fetchDataForHandle(handle);
      submissions.push(data);
    } catch (error) {
      console.error(`Error fetching data for ${handle}:`, error);
    }
  }

  return submissions;
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
    
    const submissionsFromHandles = await fetchDataForHandlesSequentially(handles);

    const acceptedProblemsFromHandles = submissionsFromHandles.map(submissions => getAcceptedProblems(submissions));
    const acceptedProblemsFromHandlesFiltered = filterByRating(filterByTag(acceptedProblemsFromHandles, tags), ratingRange);
    const commonProblemsWithCount = getCommonProblemsWithCount(acceptedProblemsFromHandlesFiltered);

    displayCommonProblems(commonProblemsWithCount, acceptedProblemsFromUser, submissionsFromUser);
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

function getCommonProblemsWithCount(acceptedProblemsFromHandles) {
  if (acceptedProblemsFromHandles.length === 0) {
    return [];
  }

  const problemCountMap = new Map();

  acceptedProblemsFromHandles.forEach(problems => {
    problems.forEach(problem => {
      const problemString = JSON.stringify(problem);

      if (problemCountMap.has(problemString)) {
        problemCountMap.set(problemString, problemCountMap.get(problemString) + 1);
      } else {
        problemCountMap.set(problemString, 1);
      }
    });
  });

  const commonProblemsWithCount = [];

  problemCountMap.forEach((count, problemString) => {
    const problem = JSON.parse(problemString);
    commonProblemsWithCount.push({ problem, count });
  });

  commonProblemsWithCount.sort((a, b) => b.count - a.count);

  return commonProblemsWithCount;
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

function displayCommonProblems(problemsWithCount, acceptedProblemsFromUser, submissionsFromUser) {
  const problemsList = document.getElementById('problems-list');
  problemsList.innerHTML = '';

  if (problemsWithCount.length === 0) {
    problemsList.innerHTML = '<p>No common problems found.</p>';
    return;
  }
  const maxElements = 1000;
  if (problemsWithCount.length > maxElements) {
    problemsWithCount = problemsWithCount.slice(0, -problemsWithCount.length + maxElements);
  }


  const ul = document.createElement('ul');
  ul.classList.add('problem-cards');

  problemsWithCount.forEach(({ problem, count }) => {
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

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    const problemLink = document.createElement('a');
    let problemType = (problem.hasOwnProperty('rating') ? 'contest' : 'gym');
    problemLink.href = `https://codeforces.com/${problemType}/${problem.contestId}/problem/${problem.index}`;
    problemLink.textContent = `${problem.name}`;

    const countElement = document.createElement('span');
    countElement.textContent = `${count}`;
    countElement.classList.add('count-value');

    contentContainer.appendChild(problemLink);
    contentContainer.appendChild(countElement);
    cardContent.appendChild(contentContainer);
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

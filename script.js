async function commonProblems() {

  displayLoading();
  const handles = parseTextBox('handles');
  const tags    = parseTextBox('tags');
  const ratings = parseTextBox('ratings');

  const userDataPromises = handles.map(handle =>
    fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Status of the request is FAILED.`);
      }).then(response => response.result)

      .catch(error => {
        console.error(`Error fetching data for ${handle}:`, error);
        return [];
      })
  );

  try {
    const submissionsByUsers = await Promise.all(userDataPromises);
    const acceptedProblemsByUsers = getAcceptedProblemsByUsers(submissionsByUsers);
    const commonProblems = getCommonProblems(acceptedProblemsByUsers);

    let filters = [
      data => filterByRating(data, ratings),
      data => filterByTag(data, tags)
    ];
    filteredCommonProblems = applyFilters(commonProblems, filters)

    displayCommonProblems(filteredCommonProblems);
  } catch (error) {
    console.error('Error getting common problems:', error);
  }
}

function getAcceptedProblemsByUsers(submissionsByUsers) {
  return submissionsByUsers.map(user =>
    removeDuplicates(
      user
        .filter(submission => submission.verdict === "OK")
        .map(submission => submission.problem)
    )
  );
}

function getCommonProblems(acceptedProblemsByUsers) { // Interssection of all users
  if (acceptedProblemsByUsers.length === 0) {
    return [];
  }
  return acceptedProblemsByUsers[0].filter(
    problemA =>
    acceptedProblemsByUsers.every(
      problems => problems.some(problemB => JSON.stringify(problemA) === JSON.stringify(problemB))
    )
  );
}

function filterByRating(problems, ratings) {
  if (ratings.length === 0) {
    return problems;
  }
  return problems.filter(problem => problem.hasOwnProperty('rating') && ratings.includes(problem.rating.toString()))
}
function filterByTag(problems, tags) {
  if (tags.length === 0) {
    return problems;
  }
  return problems.filter(problem => problem.hasOwnProperty('tags') && tags.every(tag => problem.tags.includes(tag)));
}

function displayCommonProblems(problems) {
  const problemsList = document.getElementById('problems-list');
  problemsList.innerHTML = '';

  if (problems.length === 0) {
    problemsList.innerHTML = '<p>No common problems found.</p>';
    return;
  }

  const ul = document.createElement('ul');
  problems.forEach(problem => {
    const li = document.createElement('li');
    li.textContent = `${problem.contestId}${problem.index} - ${problem.name} (${problem.rating})`;
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

function parseTextBox(label) {
  let values = document.getElementById(label).value.trim();
  if (values === '') return [];
  return values.split(',').map(name => name.trim());
}
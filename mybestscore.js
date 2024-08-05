async function mybestscore() {
    const MAX_JOBS = 10;

    async function parseBestScorePage(baseurl, difficulty, page) {
        console.log(`Loading page ${page}...`);
        const url = `${baseurl}/my_page/my_best_score.php?${difficulty}&&page=${page}`;
        const res = await fetch(url);
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "text/html");
        return Array.from(doc.querySelectorAll(".my_best_scoreList > li"))
            .map(li => {
                const chart = parseChart(li);
                const scoreData = parseScore(li);
                difficultySet.add(chart.join(''));
                return {
                    song: li.querySelector('.song_name > p').textContent,
                    style: chart[0],
                    diff: chart[1],
                    score: scoreData[0],
                    grade: scoreData[1],
                    plate: scoreData[2]
                };
            });
    }

    async function getBestScores(){
        const baseurl = window.location.origin;
        const pageCount = Math.ceil(parseInt(document.querySelector(".board_search div .t2").innerText)/12); 
        const difficulty = window.location.search.split('&')[0].substring(1); // add more options
        let scores = [];
        for (let batch = 1; batch <= pageCount; batch += MAX_JOBS) {
            let jobs = [];
            for (let page = batch; page < batch + MAX_JOBS && page <= pageCount; page++) {
                jobs.push(parseBestScorePage(baseurl, difficulty, page));
            }
            let results = await Promise.all(jobs);
            scores.push(results.flat(1));
            scores = scores.flat(1);
        }
        scores.push(Array.from(difficultySet));
        console.log("Done!");
        return scores;
    }

    function parseChart(li) {
        // [gamemode, difficulty/player count]
        let chart = ['',''];
        let chartDiv = li.querySelectorAll('.numw div');
        for (let i = 0; i < chartDiv.length; i++){
            let url = new URL(chartDiv[i].querySelector('img').src);
            let filename = url.pathname.split('/').pop().split('_');
            if (filename.length > 2){
                chart[0] = filename[0];
                chart[1] += filename[2][0];
            }
        }
        return chart;
    }

    function parseScore(li){
        // [score, grade, plate]
        let scoreData = [];
        const scoreDiv = li.querySelectorAll('.etc_con img');
        scoreData.push(li.querySelector('.num').textContent.split(',').join(''));

        const gradeimg = new URL(scoreDiv[0].src).pathname.split('/').pop().split('.')[0].split('_');
        scoreData.push(gradeimg[0]);
        if (gradeimg[1] === 'p'){
            scoreData[1] += '+';
        }

        scoreData.push(new URL(scoreDiv[1].src).pathname.split('/').pop().split('.')[0]);
        return scoreData;
    }

    var difficultySet = new Set();
    var scores = await getBestScores();
    window.document.write(JSON.stringify(scores));
}

mybestscore();
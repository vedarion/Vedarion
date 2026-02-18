var BANK_SN = null;
var BANK_CP = null;
var currentTier = 0, quizQs = [], userAns = {};

var SUFFICIENT_CATS = ['if', 'all', 'every', 'whenever', 'when', 'people_who', 'each', 'any', 'the_only'];
var NECESSARY_CATS = ['then', 'must', 'only_if', 'only_when', 'requires', 'depends_on'];

fetch('vedamark-conditional-logic-bank.json')
.then(function(r) { return r.json() })
.then(function(data) {
    BANK_SN = {};
    data.categories.forEach(function(cat) { BANK_SN[cat.id] = cat.questions });
})
.catch(function(err) { console.error('Failed to load S&N bank:', err) });

fetch('vedamark-contrapositive-bank.json')
.then(function(r) { return r.json() })
.then(function(data) {
    BANK_CP = [];
    data.categories.forEach(function(cat) {
        cat.questions.forEach(function(q) { BANK_CP.push(q) });
    });
})
.catch(function(err) { console.error('Failed to load contrapositive bank:', err) });

function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = a[i];
        a[i] = a[j]; a[j] = t;
    }
    return a;
}

function pickSNQuestions() {
    var picked = [];
    // 3 sufficient from different categories
    var suffCats = shuffle(SUFFICIENT_CATS.slice()).slice(0, 3);
    suffCats.forEach(function(id) {
        if (BANK_SN[id] && BANK_SN[id].length > 0) {
            var q = shuffle(BANK_SN[id])[0];
            q._type = 'sufficient';
            picked.push(q);
        }
    });
    // 2 necessary from different categories
    var necCats = shuffle(NECESSARY_CATS.slice()).slice(0, 2);
    necCats.forEach(function(id) {
        if (BANK_SN[id] && BANK_SN[id].length > 0) {
            var q = shuffle(BANK_SN[id])[0];
            q._type = 'necessary';
            picked.push(q);
        }
    });
    return shuffle(picked);
}

function pickCPQuestions() {
    return shuffle(BANK_CP.slice()).slice(0, 5);
}

function selectTier(t) {
    currentTier = t;
    document.querySelectorAll('.tier-card').forEach(function(c, i) {
        c.classList.remove('selected');
        if (i === t) c.classList.add('selected');
    });
}

function startQuiz() {
    if (currentTier === 0 && !BANK_SN) { alert('Question bank is still loading. Please try again.'); return; }
    if (currentTier === 1 && !BANK_CP) { alert('Question bank is still loading. Please try again.'); return; }
    userAns = {};
    var questions;
    if (currentTier === 0) {
        questions = pickSNQuestions();
    } else {
        questions = pickCPQuestions();
    }
    quizQs = questions.map(function(q) {
        var opts = shuffle([{ text: q.correct, isCorrect: true }, { text: q.wrong, isCorrect: false }]);
        return { sentence: q.sentence, question: q.question, options: opts, explanation: q.explanation };
    });
    document.getElementById('vm-levels').style.display = 'none';
    document.getElementById('vm-results').classList.remove('visible');
    var el = document.getElementById('vm-quiz');
    el.classList.add('visible');
    var tierNames = ['I: Sufficient & Necessary', 'II: Contrapositive'];
    var h = '<div class="quiz-progress"><span class="quiz-progress-text"><strong>VedaMark ' + tierNames[currentTier] + '</strong> · 5 questions</span><span class="quiz-score-label"><a onclick="backToLevels()">← Change level</a> · 80% to pass</span></div>';
    quizQs.forEach(function(q, qi) {
        h += '<div class="q-block"><div class="q-block-header"><div class="q-num">Question ' + (qi + 1) + '</div><div class="q-sentence">"' + q.sentence + '"</div><div class="q-ask">' + q.question + '</div></div><div class="q-options">';
        ['A', 'B'].forEach(function(l, oi) {
            h += '<div class="q-opt" data-q="' + qi + '" data-o="' + oi + '" onclick="pickOpt(' + qi + ',' + oi + ')"><span class="ol">' + l + '</span>' + q.options[oi].text + '</div>';
        });
        h += '</div><div class="q-explanation" id="exp-' + qi + '"><div class="q-explanation-label">Explanation</div><p class="q-explanation-text">' + q.explanation + '</p></div></div>';
    });
    h += '<button class="vm-btn" onclick="submitQuiz()" style="margin-top:20px">SUBMIT ANSWERS</button>';
    el.innerHTML = h;
    window.scrollTo({ top: document.querySelector('.vm-header').offsetTop - 10, behavior: 'smooth' });
}

function pickOpt(qi, oi) {
    document.querySelectorAll('.q-opt[data-q="' + qi + '"]').forEach(function(e) { e.classList.remove('selected') });
    document.querySelector('.q-opt[data-q="' + qi + '"][data-o="' + oi + '"]').classList.add('selected');
    userAns[qi] = oi;
}

function submitQuiz() {
    if (Object.keys(userAns).length < quizQs.length) { alert('Please answer all questions before submitting.'); return; }
    var correct = 0;
    quizQs.forEach(function(q, qi) {
        var picked = userAns[qi];
        document.querySelectorAll('.q-opt[data-q="' + qi + '"]').forEach(function(o, oi) {
            o.classList.add('disabled'); o.onclick = null;
            if (q.options[oi].isCorrect) o.classList.add('correct');
            if (oi === picked && !q.options[oi].isCorrect) o.classList.add('incorrect');
        });
        if (q.options[picked].isCorrect) correct++;
        document.getElementById('exp-' + qi).classList.add('show');
    });
    var pct = Math.round((correct / quizQs.length) * 100), passed = pct >= 80;
    var el = document.getElementById('vm-results');
    var tierNames = ['I: Sufficient & Necessary', 'II: Contrapositive'];
    var h = '<div class="results-card"><div class="results-score">' + correct + '/' + quizQs.length + '</div><div class="results-label">VedaMark ' + tierNames[currentTier] + '</div>';
    if (passed) { h += '<div class="results-pass">✓ You hit the Mark!</div><div class="results-msg">Great work. Try another level or retry for fresh questions.</div>' }
    else { h += '<div class="results-fail">✗ Not quite — you need 80%</div><div class="results-msg">Review the explanations above, then try again with fresh questions.</div>' }
    h += '<div class="results-actions"><button class="results-btn primary" onclick="retryTier()">TRY AGAIN</button><button class="results-btn secondary" onclick="backToLevels()">CHANGE LEVEL</button></div></div>';
    el.innerHTML = h; el.classList.add('visible');
    window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
}

function retryTier() {
    document.getElementById('vm-quiz').classList.remove('visible');
    document.getElementById('vm-results').classList.remove('visible');
    startQuiz();
}

function backToLevels() {
    document.getElementById('vm-quiz').classList.remove('visible');
    document.getElementById('vm-results').classList.remove('visible');
    document.getElementById('vm-levels').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
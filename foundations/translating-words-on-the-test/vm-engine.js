var BANK = null;
var quizQs = [], userAns = {}, emailUnlocked = false;

var ALL_CATS = ['all','some','many','most','nearly_all','usually','generally','frequently','always','never'];

fetch('translating-words-bank.json')
.then(function(r){return r.json()})
.then(function(data){
    BANK={};
    data.categories.forEach(function(cat){BANK[cat.id]=cat.questions});
})
.catch(function(err){console.error('Failed to load question bank:',err)});

function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

function pickQuestions(n){
    var catIds=shuffle(ALL_CATS.slice()).slice(0,n);
    var picked=[];
    catIds.forEach(function(id){
        if(BANK[id]&&BANK[id].length>0){
            var q=shuffle(BANK[id])[0];
            picked.push(q);
        }
    });
    return shuffle(picked);
}

function showEmailModal(){document.getElementById('email-overlay').style.display='flex'}
function closeEmailModal(){document.getElementById('email-overlay').style.display='none'}

function submitEmail(){
    var email=document.getElementById('lead-email').value.trim();
    var err=document.getElementById('email-error');
    if(!email||!email.includes('@')||!email.includes('.')){err.textContent='Please enter a valid email.';return}
    err.textContent='';
    emailUnlocked=true;
    closeEmailModal();
    startQuiz();
}

function startQuiz(){
    if(!BANK){alert('Question bank is still loading. Please try again.');return}
    if(!emailUnlocked){showEmailModal();return}
    userAns={};
    var questions=pickQuestions(5);
    quizQs=questions.map(function(q){
        var opts=shuffle([{text:q.correct,isCorrect:true},{text:q.wrong,isCorrect:false}]);
        return{sentence:q.sentence,options:opts,explanation:q.explanation}
    });
    document.getElementById('vm-levels').style.display='none';
    document.getElementById('vm-results').classList.remove('visible');
    var el=document.getElementById('vm-quiz');
    el.classList.add('visible');
    var h='<div class="quiz-progress"><span class="quiz-progress-text"><strong>VedaMark</strong> · 5 questions</span><span class="quiz-score-label">80% to pass</span></div>';
    quizQs.forEach(function(q,qi){
        h+='<div class="q-block"><div class="q-block-header"><div class="q-num">Question '+(qi+1)+'</div><div class="q-sentence">"'+q.sentence+'"</div><div class="q-ask">Which of the following can we 100% support?</div></div><div class="q-options">';
        ['A','B'].forEach(function(l,oi){h+='<div class="q-opt" data-q="'+qi+'" data-o="'+oi+'" onclick="pickOpt('+qi+','+oi+')"><span class="ol">'+l+'</span>'+q.options[oi].text+'</div>'});
        h+='</div><div class="q-explanation" id="exp-'+qi+'"><div class="q-explanation-label">Translation</div><p class="q-explanation-text">'+q.explanation+'</p></div></div>';
    });
    h+='<button class="vm-btn" onclick="submitQuiz()" style="margin-top:20px">SUBMIT ANSWERS</button>';
    el.innerHTML=h;
    window.scrollTo({top:document.querySelector('.vm-header').offsetTop-10,behavior:'smooth'});
}

function pickOpt(qi,oi){
    document.querySelectorAll('.q-opt[data-q="'+qi+'"]').forEach(function(e){e.classList.remove('selected')});
    document.querySelector('.q-opt[data-q="'+qi+'"][data-o="'+oi+'"]').classList.add('selected');
    userAns[qi]=oi;
}

function submitQuiz(){
    if(Object.keys(userAns).length<quizQs.length){alert('Please answer all questions before submitting.');return}
    var correct=0;
    quizQs.forEach(function(q,qi){
        var picked=userAns[qi];
        document.querySelectorAll('.q-opt[data-q="'+qi+'"]').forEach(function(o,oi){
            o.classList.add('disabled');o.onclick=null;
            if(q.options[oi].isCorrect)o.classList.add('correct');
            if(oi===picked&&!q.options[oi].isCorrect)o.classList.add('incorrect');
        });
        if(q.options[picked].isCorrect)correct++;
        document.getElementById('exp-'+qi).classList.add('show');
    });
    var pct=Math.round((correct/quizQs.length)*100),passed=pct>=80;
    var el=document.getElementById('vm-results');
    var h='<div class="results-card"><div class="results-score">'+correct+'/'+quizQs.length+'</div><div class="results-label">VedaMark · Translating Words</div>';
    if(passed){h+='<div class="results-pass">✓ You hit the Mark!</div><div class="results-msg">Great work. Retry for fresh questions from different categories.</div>'}
    else{h+='<div class="results-fail">✗ Not quite — you need 80%</div><div class="results-msg">Review the explanations above, then try again with fresh questions.</div>'}
    h+='<div class="results-actions"><button class="results-btn primary" onclick="retryQuiz()">TRY AGAIN</button></div></div>';
    el.innerHTML=h;el.classList.add('visible');
    window.scrollTo({top:el.offsetTop-20,behavior:'smooth'});
}

function retryQuiz(){
    document.getElementById('vm-quiz').classList.remove('visible');
    document.getElementById('vm-results').classList.remove('visible');
    startQuiz();
}
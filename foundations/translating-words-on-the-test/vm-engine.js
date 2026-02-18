var BANK = null;
var currentTier=0, quizQs=[], userAns={}, emailUnlocked=false;

var TIER_MAP = {
    easy: ['all','some','many','most','nearly_all'],
    medium: ['usually','generally','frequently','always','never','not_all','few'],
    hard: ['negate_sufficient','negate_necessary','combined_negations']
};

fetch('translating-words-bank.json')
.then(function(r){return r.json()})
.then(function(data){
    BANK={};
    data.categories.forEach(function(cat){BANK[cat.id]=cat.questions});
    updateLocks();
})
.catch(function(err){console.error('Failed to load question bank:',err)});

function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

function pickFromTier(tierKey,n){
    var catIds=shuffle(TIER_MAP[tierKey].slice());
    var picked=[];
    // First: one from each category (up to n)
    var catsToUse=catIds.slice(0,n);
    catsToUse.forEach(function(id){
        if(BANK[id]&&BANK[id].length>0){
            var q=shuffle(BANK[id])[0];
            picked.push(q);
        }
    });
    // If we still need more (hard has 3 cats but needs 5), pick extras from random cats
    while(picked.length<n){
        var randCat=catIds[Math.floor(Math.random()*catIds.length)];
        if(BANK[randCat]&&BANK[randCat].length>0){
            var q=shuffle(BANK[randCat])[0];
            // Avoid duplicates
            var isDup=false;
            picked.forEach(function(p){if(p.id===q.id)isDup=true});
            if(!isDup)picked.push(q);
        }
    }
    return shuffle(picked);
}

function selectTier(t){
    if(t>0&&!emailUnlocked){showEmailModal();return}
    currentTier=t;
    document.querySelectorAll('.tier-card').forEach(function(c,i){c.classList.remove('selected');if(i===t)c.classList.add('selected')});
}

function updateLocks(){
    var l1=document.getElementById('lock-1'),l2=document.getElementById('lock-2'),t1=document.getElementById('tier-1'),t2=document.getElementById('tier-2');
    if(emailUnlocked){
        l1.textContent='✓ Unlocked';l1.style.color='#3A8A5C';t1.classList.remove('locked');
        l2.textContent='✓ Unlocked';l2.style.color='#3A8A5C';t2.classList.remove('locked');
    }else{
        l1.textContent='🔒 Email required';t1.classList.add('locked');
        l2.textContent='🔒 Email required';t2.classList.add('locked');
    }
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
    updateLocks();
}

function startQuiz(){
    if(!BANK){alert('Question bank is still loading. Please try again.');return}
    if(currentTier>0&&!emailUnlocked){showEmailModal();return}
    userAns={};
    var tierKeys=['easy','medium','hard'];
    var questions=pickFromTier(tierKeys[currentTier],5);
    quizQs=questions.map(function(q){
        var opts=shuffle([{text:q.correct,isCorrect:true},{text:q.wrong,isCorrect:false}]);
        return{sentence:q.sentence,options:opts,explanation:q.explanation}
    });
    document.getElementById('vm-levels').style.display='none';
    document.getElementById('vm-results').classList.remove('visible');
    var el=document.getElementById('vm-quiz');
    el.classList.add('visible');
    var tierNames=['I: Recognition','II: Precision','III: Command'];
    var h='<div class="quiz-progress"><span class="quiz-progress-text"><strong>VedaMark '+tierNames[currentTier]+'</strong> · 5 questions</span><span class="quiz-score-label"><a onclick="backToLevels()">← Change level</a> · 80% to pass</span></div>';
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
    var tierNames=['I: Recognition','II: Precision','III: Command'];
    var h='<div class="results-card"><div class="results-score">'+correct+'/'+quizQs.length+'</div><div class="results-label">VedaMark '+tierNames[currentTier]+'</div>';
    if(passed){h+='<div class="results-pass">✓ You hit the Mark!</div><div class="results-msg">Great work. Try another level or retry for fresh questions.</div>'}
    else{h+='<div class="results-fail">✗ Not quite — you need 80%</div><div class="results-msg">Review the explanations above, then try again with fresh questions.</div>'}
    h+='<div class="results-actions"><button class="results-btn primary" onclick="retryTier()">TRY AGAIN</button><button class="results-btn secondary" onclick="backToLevels()">CHANGE LEVEL</button></div></div>';
    el.innerHTML=h;el.classList.add('visible');
    window.scrollTo({top:el.offsetTop-20,behavior:'smooth'});
}

function retryTier(){
    document.getElementById('vm-quiz').classList.remove('visible');
    document.getElementById('vm-results').classList.remove('visible');
    startQuiz();
}

function backToLevels(){
    document.getElementById('vm-quiz').classList.remove('visible');
    document.getElementById('vm-results').classList.remove('visible');
    document.getElementById('vm-levels').style.display='block';
    window.scrollTo({top:0,behavior:'smooth'});
}

updateLocks();
document.addEventListener("DOMContentLoaded", function() {
let createThreadBtn= document.getElementById('createThreadBtn');
let hiddenCreateThreadDiv= document.getElementById('hiddenCreateThreadDiv');
let headingList= document.getElementById('headingList'); 

function displayHideCreateThread(event){

    event.preventDefault(); // prevent default form submission
    if(hiddenCreateThreadDiv.style.display==='none'){
        hiddenCreateThreadDiv.style.display='block';
        headingList.style.display='none';
        createThreadBtn.innerHTML="Tillbaka till startsidan";
    }
     else{
         hiddenCreateThreadDiv.style.display='none';
         headingList.style.display='block';
         createThreadBtn.innerHTML="Skapa ny tråd";

     }

}
if(createThreadBtn){
createThreadBtn.addEventListener('click', displayHideCreateThread);
}
});
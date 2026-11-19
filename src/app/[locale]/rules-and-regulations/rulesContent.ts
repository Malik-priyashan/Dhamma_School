type Rule = { number: string; text: string; items?: string[] };
type Section = { number: string; title: string; rules: Rule[] };

export type RulesContent = {
  school: string;
  location: string;
  contents: string;
  introduction: string;
  sections: Section[];
  declarationTitle: string;
  declarationBeforeName: string;
  declarationAfterName: string;
};

const sinhala: RulesContent = {
  school: "සිරි සුමනතිස්ස ධර්ම විද්‍යාලය",
  location: "ශ්‍රී පුෂ්පාරාම පිරිවෙණ, වැලිවේරිය, මාතර",
  contents: "නීති මාලාවේ කොටස්",
  introduction: "දහම් පාසල අඛණ්ඩව හා ස්ථිරසාරව පවත්වාගෙන යෑමේදී පොදු සමාජයටත්, තම දරුවාටත් සහ එම ආයතනය පවත්වාගෙන යනු ලබන හා නිස්සරණාධ්‍යාශයෙන් කැප වී සිටින ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේ ප්‍රමුඛ ආචාර්ය මණ්ඩලයටත් යහ පාලනය හා යහ පැවැත්ම උදෙසා 2011 නොවැම්බර් මස හය වැනි දින පැවති ගුරු දෙගුරු මහ සභා රැස්වීමේදී ඒකමතිකව සභා සම්මත කර ගත් සහ පැරණි නීතිරීති හා සම්ප්‍රදායන් සංශෝධනය කරමින් ගනු ලැබූ නව නීතිරීති, රෙගුලාසි, නියෝග හා විධිවිධාන මෙසේය.",
  sections: [
    {
      number: "01", title: "දහම් පාසල නිර්වචනය කිරීම", rules: [
        { number: "", text: "දහම් පාසල යනු බුද්ධ ධර්මය ඉගැන්වීම කරනු ලබන ආයතනයක් හෝ එම විෂය සඳහා රජයේ පාසලකට අනුබද්ධිත හෝ සමගාමීව පවත්වාගෙන යනු ලබන පුනරීක්ෂණ පාඩම් මාලා පවත්වන ආයතනයක් නොව, තම දරුවා සමාජානුයෝජනය කිරීමේදී බෞද්ධ අධ්‍යාපනය තුළින් බොදු දරුවෙකුගේ බෞද්ධ චින්තනය, බෞද්ධ ශික්ෂණය හා සංවරකම යනාදී ගුණාංග සමුදායක් බෞද්ධ පරිසරයක් තුළින් සංවර්ධනය කර ගැනීම උදෙසා අදාළ අරමුණු පෙරදැරි කරගෙන පවත්වාගෙන යනු ලබන සම්ප්‍රදායික බෞද්ධ අධ්‍යාපන ආයතනයකි." },
      ],
    },
    {
      number: "02", title: "සිසු අත්පොත පිළිබඳ නියෝග", rules: [
        { number: "2.1", text: "දහම් පාසලට ඇතුළත් කරගන්නා සෑම ශිෂ්‍ය-ශිෂ්‍යාවකටම නිකුත් කරනු ලබන සිසු අත්පොතෙහි ‘දහම් පාසලේ නීතිරීති හා සම්ප්‍රදායන්’ සහ ‘දෙමාපියන්ට වදනක්’ යන තේමා යටතේ අඩංගු කරනු ලැබූ උපදෙස් මාලාව හොඳින් කියවා බලා ඒවා අනුගමනය කිරීම දෙමාපියන්ගේත්, එසේම ඒවා අනුගමනය කිරීමට තම දරුවා පෙළඹවීමත්, එම නීතිරීති කිසිදු අයුරකින් කඩ නොකිරීමට වගබලා ගැනීමටත් ඉහත කී දෙපාර්ශ්වය විසින් සහතික විය යුතුය." },
        { number: "2.2", text: "සිසු අත්පොතෙහි දෙමාපියන් සඳහා විස්තර ඇතුළත් කිරීමට සකසා ඇති ආකෘති කොටස අනිවාර්යයෙන්ම ශිෂ්‍යයාගේ හෝ ශිෂ්‍යාවගේ දෙමාපියන් හෝ භාරකරු විසින් එම අත්පොත සිසුවාට නිකුත් කළ වහාම සම්පූර්ණ කර සනාථ කොට තිබිය යුතුය." },
        { number: "2.3", text: "දහම් පාසල් අධ්‍යයන කාලය තුළ සිසු අත්පොත අනිවාර්යයෙන්ම ළඟ තබා ගත යුතු අතර එය රැගෙන නොපැමිණෙන ශිෂ්‍යයා හෝ ශිෂ්‍යාව කිසිදු හේතුවක් මත හෝ පූර්ව දැනුම්දීමකින් තොරව දහම් පාසලට භාර ගනු නොලැබේ." },
      ],
    },
    {
      number: "03", title: "අධ්‍යාපන හා අධ්‍යයන කටයුතු පිළිබඳ නියෝග", rules: [
        { number: "3.1", text: "අධ්‍යයන කාලය තුළදී අධ්‍යයන කටයුතු සඳහා අනලස්ව ක්‍රියාකාරීව සම්බන්ධ විය යුතු අතර දහම් පාසල මගින් සංවිධානය කරන පොහොය දින වැඩසටහන් ආදී සියලුම බාහිර ක්‍රියාකාරකම්වලටද පූර්ණ දායකත්වය දැක්විය යුතුය." },
        { number: "3.2", text: "පද්‍ය හා ගාථා පන්ති පාඩම් කිරීම හා සිසු පැවරුම් ආදිය ඊළඟ පැමිණෙන දහම් පාසල් දිනයේදී සම්පූර්ණ කර නොමැති, උනන්දු නොවන හා සැලකිල්ලක් නොදක්වන ශිෂ්‍ය-ශිෂ්‍යාවන් පිළිබඳව ඊට සුදුසු ක්‍රියාමාර්ග ගැනීම පන්තිභාර ගුරුභවතා විසින් සිදු කරනු ලැබේ." },
        { number: "3.3", text: "ශිෂ්‍යයාගේ හෝ ශිෂ්‍යාවගේ ප්‍රමාණවත් පැමිණීම වාර්තා නොවන අවස්ථාවලදී ඔහුට හෝ ඇයට වසර අවසාන ශ්‍රේණි විභාගයට පෙනී සිටීමට අවස්ථාව ලබා නොදෙනු ලැබේ." },
        { number: "3.4", text: "අධ්‍යයන වසරකදී පවත්වනු ලබන වාර පරීක්ෂණ තුනටම පෙනී නොසිටින ශිෂ්‍ය-ශිෂ්‍යාවන්ට වසර අවසානයේදී ඊළඟ ශ්‍රේණියට කිසිදු හේතුවක් මත හෝ පූර්ව දැනුම්දීමකින් තොරව ඇතුළත් කරනු නොලැබේ." },
        { number: "3.5", text: "දහම් පාසල මගින් බාහිර තරඟ සඳහා ශිෂ්‍ය-ශිෂ්‍යාවන් ඉදිරිපත් කරන අවස්ථාවලදී දහම් පාසලේ නිවාසාන්තර තරඟවලින් උපරිම දක්ෂතා පෙන්වන සිසු සිසුවියන් ඉදිරිපත් කරනු ලබන අතර එම තෝරා ගැනීම් විධිමත් ක්‍රියා පටිපාටියකට අනුව සිදු කරනු ලබන බැවින් දෙමාපියන් ඒ පිළිබඳව පෙර හෝ පසු විපරම් නොකළ යුතුය." },
        { number: "3.6", text: "ශ්‍රී ලංකා විභාග දෙපාර්තමේන්තුව පවත්වනු ලබන දහම් පාසල් අවසාන විභාගයට පෙනී සිටින ශිෂ්‍ය-ශිෂ්‍යාවන් හට විභාගයට පෙනී සිටීමට අවස්ථාව ලබා දෙන්නේ ප්‍රමාණවත් පැමිණීමේ දින සංඛ්‍යාවක් (අවමය දින 30 ක්) සපුරා ඇත්නම් පමණි. ඔහුට හෝ ඇයට අදාළ මුද්‍රිත පොත් ලබා දෙන්නේද විභාගයට නම ඇතුළත් කළ පසුව වන අතර නැවත එම පොත් හා වෙනත් ඕනෑම පොතක් ආයතනයට විභාගයෙන් පසුව ලබා දීමට ඇති අයිතිය දරුවා මෙන්ම දෙමාපියන්ද මෙම නීතිමාලාවෙන් බැඳී සිටී. එසේ නොකරන ඕනෑම ශිෂ්‍ය-ශිෂ්‍යාවකට කිසිදු සහතිකයක්, චරිත සහතිකයක් හෝ වෙනත් ලේඛනයක් ලබා දෙනු නොලැබේ. දැනට ශිෂ්‍යභාවය නොමැති කිසිදු ශිෂ්‍ය-ශිෂ්‍යාවකට චරිත සහතිකයක් හෝ වෙනත් කිසිදු ලේඛනයක් ලබා නොදෙනු ලැබේ." },
      ],
    },
    {
      number: "04", title: "විනයානුකූල ක්‍රියාමාර්ග පිළිබඳ නියෝග", rules: [
        { number: "4.1", text: "ශිෂ්‍යයෙක් හෝ ශිෂ්‍යාවක් විසින් සිදු කරනු ලබන විනය කඩකිරීමේදී වරදෙහි ස්වභාවය අනුව පහත සඳහන් පරිදි ක්‍රියා කරනු ලැබේ.", items: ["අවවාද කිරීම", "දහම් පාසලේ පොදු කටයුතු සඳහා යෙදවීම", "ප්‍රමාණවත් ශාරීරික දඬුවමක් ලබා දීම", "දෙමාපියන් ගෙන්වා දැනුවත් කිරීම", "සති තුනක් දක්වා පන්ති තහනම් කිරීම", "දහම් පාසලෙන් නෙරපා හැරීම"] },
        { number: "", text: "ඉහත දක්වා ඇති දඬුවම් විනය මණ්ඩලය විසින් නිර්දේශ කරනු ලබන අතර ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේ විසින් අනුමත කිරීමෙන් පසුව පමණක් ක්‍රියාත්මක කරනු ලැබේ." },
        { number: "4.2", text: "ශිෂ්‍ය-ශිෂ්‍යාවන් විසින් සිදු කරනු ලබන කිසියම් වරදකදී ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේ හෝ වෙනත් අදාළ ගුරුභවතෙකු ඊට සුදුසු දඬුවමක් හෝ ඉන් කිහිපයක් එකවර ලබා දීමට ඇති අයිතිය පිළිගන්නා බවත්, එසේ කිරීමෙන් පසුව දරුවාගේ වැරැද්ද අවබෝධ කර දීමට දෙමාපියන් වෙත ඇති අයිතියත්, ඉන් ජනිතවන්නා වූ මානසිකත්වය විඳ දරා ගන්නා බවට සහතික වීම පිළිගනු ලැබේ." },
        { number: "4.3", text: "දහම් පාසල තුළදී හා පිටතදීද දහම් පාසලේ නීති හා සම්ප්‍රදායන්වලට පටහැනිව එහි විනයට හා කීර්තිනාමයට කැළලක් වන අයුරින් හැසිරෙන ඕනෑම ශිෂ්‍ය-ශිෂ්‍යාවකට විනයානුකූලව දඬුවම් පැනවීමේදී ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේ හා / හෝ ආචාර්ය මණ්ඩලයේ ගුරුභවතෙකු විසින් දෙනු ලබන ඊට අදාළ සුදුසු දඬුවමක් කෙරෙහි නැවත චෝදනා ඉදිරිපත් කිරීමට නොහැකි වන අතර, හුදෙක්ම එසේ ලබා දෙන්නේ දරුවාගේ අනාගත අභිවෘද්ධිය වර්ධනය කිරීම පිණිස බැවින් ඊට දෙමාපියන් කිසිදු අයුරකින් මැදහත් වීමක් නොකළ යුතුය." },
        { number: "4.4", text: "එසේ දෙනු ලබන දඬුවම සඳහා දෙමාපියන් විසින් සොයා බලන්නේ නම් ඒ සඳහා පැමිණිය යුත්තේ දහම් පාසල පවත්වන දිනයක දහම් පාසල් අධ්‍යයන කාලය තුළදී ආයතනික කාර්යාලයේදී පමණි. ඒ සම්බන්ධව සොයා බැලීමට විහාරස්ථානයේ සංඝාවාසය වෙත එම කාල වේලාවේදී හෝ වෙනත් කාල වේලාවකදී පැමිණීමෙන් වැළකී සිටිය යුතුය." },
        { number: "4.5", text: "ආයතනයේ සියලුම ක්‍රියාකාරකම් පිළිබඳව අවසාන තීරණය හෝ තීරණ ගැනීමේ පූර්ණ බලය මෙම ව්‍යවස්ථාවෙන් ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේ වෙත සතුවන අතර ඒ සඳහා කිසිදු බලපෑමක් ශිෂ්‍ය-ශිෂ්‍යාවන්ට, දෙමාපියන්ට හෝ වෙනත් කිසිදු බාහිර පාර්ශ්වයකට සිදු කළ නොහැකිය." },
      ],
    },
    {
      number: "05", title: "ලේඛනවලින් ඉවත් කිරීමේ නියෝග", rules: [
        { number: "5.1", text: "යම් හෙයකින් තම දරුවා හට දහම් පාසලට නොපැමිණීමට නොවැළැක්විය හැකි හේතුවක් තිබේ නම් ඒ පිළිබඳව ලිඛිතව ප්‍රධානාචාර්ය හිමිපාණන් වහන්සේට හෝ පන්තිභාර ගුරුභවතා වෙත දැනුම් දීම දෙමාපියන්ගේ අනිවාර්ය යුතුකමක් හා වගකීමක් වන්නේය." },
        { number: "5.2", text: "පූර්ව දැනුම්දීමකින් තොරව හෝ සාධාරණ හේතු දැක්වීමක් ලිඛිතව ඉදිරිපත් නොකොට දහම් පාසලට සති දෙකක කාලයක් අඛණ්ඩව නොපැමිණ සිටියහොත් දහම් පාසල හැරගියා සේ සලකා එම ශිෂ්‍යයාගේ හෝ ශිෂ්‍යාවගේ නම පූර්ව දැනුම්දීමකින් තොරව නාම ලේඛනය ඇතුළු වෙනත් ආයතනික ලේඛනවලින් ඉවත් කරනු ලැබේ. තවද එම තීරණය කිසිදු හේතුවක් මත හෝ වෙනස් කරනු නොලැබේ." },
      ],
    },
    {
      number: "06", title: "බැහැරව යෑමේ නියෝග", rules: [
        { number: "6.1", text: "තම දරුවා සෑම ඉරු දිනකම දහම් පාසලට භාරදීමෙන් පසුව අසනීප තත්ත්වයක් හෝ හදිසි තත්ත්වයක් හමුවේ හැර අධ්‍යයන කාලය තුළදී කිසිදු හේතුවක් නිසා හෝ දරුවාට දහම් පාසල අවසන් වන තුරු බැහැර වීමට ඉඩ නොදෙනු ලැබේ." },
        { number: "6.2", text: "දරුවා බැහැරව රැගෙන යෑම සඳහා සිසු අත්පොතෙහි අත්සන් කොට ඇති මව, පියා හෝ භාරකරු පැමිණිය යුතුය." },
      ],
    },
    {
      number: "07", title: "විධිවිධාන සංශෝධනය කිරීම", rules: [
        { number: "", text: "ඉහත දක්වා ඇති සියලුම නීතිරීති ක්‍රියාත්මක කිරීමේ බලය, සංශෝධනය කිරීමේ බලය, අලුත් කිරීමේ බලය, ප්‍රතිව්‍යුහගත කිරීමේ බලය හා බල රහිත කිරීමේ අයිතියද දහම් පාසලේ අධිකාරිත්වය හට මෙම ලිඛිත ව්‍යවස්ථාවෙන් පූර්ණ බලතල සහිතව හිමිවේ." },
      ],
    },
  ],
  declarationTitle: "දෙමාපිය / භාරකරු ප්‍රකාශය",
  declarationBeforeName: "",
  declarationAfterName: " නැමැති මාගේ දරුවා හෝ මා භාරයේ සිටින දරුවා මෙම ධර්ම විද්‍යාලයට ඇතුළත් කරනු ලබන්නේ මෙම ව්‍යවස්ථාව කියවා බලා හොඳින් තේරුම් ගැනීමෙන් පසුව බවත්, ඒ අනුව දරුවා සම්බන්ධව ඔහුගේ / ඇයගේ අනාගත අභිවෘද්ධිය, ධර්ම විද්‍යාලයේ වෙනත් ඕනෑම දරුවෙකුගේ අභිවෘද්ධිය හා ආයතනයේ අභිවෘද්ධිය වෙනුවෙනුත්, සියලුම පාර්ශ්වයන්ගේ ආරක්ෂාව වෙනුවෙනුත් ගෙන ඇති නීතිරීති මාලාවට විරුද්ධ නොවන බවත්, ඊට විරුද්ධව නෛතික හෝ දේශපාලනික බලපෑමක් හෝ නෛතික කටයුතු කිරීමට නොයන බවත්, එසේ නොකරන බවට මා විසින් පැහැදිලි අවබෝධයෙන් අත්සන් කිරීමෙන් පසු හොඳ මානසිකත්වයෙන් කටයුතු කරන බවත්, එය විඳ දරා ගැනීමට හැකියාව ඇති බවත්, යම් හෙයකින් නෛතික තත්ත්වයකට යන්නේ නම් එසේ කිරීමෙන්ද ඊට අදාළ නෛතික ආයතනයේදී තමාගේ අතින් සිදු වූ වරදක් සේ එය සලකන බවටත් මින් සහතික වෙමින් ප්‍රකාශ කරමි.",
};

const english: RulesContent = {
  school: "Siri Sumanathissa Dhamma School",
  location: "Sri Pushparama Pirivena, Weliweriya, Matara",
  contents: "In this document",
  introduction: "These rules, regulations, orders and provisions were unanimously approved at the teachers’ and parents’ meeting held on 6 November 2011. They revise earlier rules and customs to support the school’s continued operation, good governance and the wellbeing of students, families and the teaching staff.",
  sections: [
    { number: "01", title: "Definition of the Dhamma School", rules: [
      { number: "", text: "A Dhamma School is a traditional Buddhist educational institution. It is not merely a place that teaches Buddhist doctrine or offers revision classes alongside a state school. Its purpose is to help children develop Buddhist thought, discipline, restraint and other qualities within a Buddhist environment as they grow into society." },
    ] },
    { number: "02", title: "Rules concerning the student handbook", rules: [
      { number: "2.1", text: "Every student receives a handbook. Parents must read and follow the instructions under ‘Dhamma School rules and traditions’ and ‘A word to parents’, encourage their child to follow them, and ensure that neither party breaks these rules." },
      { number: "2.2", text: "The parent or guardian must complete and certify the parent information section of the handbook as soon as it is issued to the student." },
      { number: "2.3", text: "Students must keep the handbook with them throughout school hours. A student who arrives without it will not be admitted to the Dhamma School without prior notice, regardless of the reason." },
    ] },
    { number: "03", title: "Education and learning activities", rules: [
      { number: "3.1", text: "Students must participate actively in learning activities during school hours and take part fully in external activities organized by the school, including Poya day programmes." },
      { number: "3.2", text: "The class teacher may take appropriate action when students do not learn assigned verses and stanzas, complete assignments by the next school day, show interest, or pay attention." },
      { number: "3.3", text: "A student without sufficient attendance will not be allowed to sit the end-of-year grade examination." },
      { number: "3.4", text: "Students who do not sit all three term tests in an academic year will not be promoted to the next grade at year end, regardless of the reason or without prior notice." },
      { number: "3.5", text: "For competitions outside the school, students who show the strongest performance in the school’s inter-house competitions will be selected through a formal procedure. Parents should not question the selection before or after it is made." },
      { number: "3.6", text: "Students may sit the final Dhamma School examination held by the Sri Lanka Department of Examinations only if they have attended for a sufficient number of days (at least 30). Printed books are issued after their names have been entered for the examination. Students and parents must return those books, and any other books, to the school after the examination. A student who does not do so will not receive a certificate, character certificate or other document. Former students will not receive a character certificate or other document." },
    ] },
    { number: "04", title: "Disciplinary measures", rules: [
      { number: "4.1", text: "Depending on the nature of a breach of discipline, one or more of the following measures may be taken:", items: ["A warning", "Assignment to general school duties", "Reasonable corporal punishment", "Calling the parents and informing them", "Suspension from classes for up to three weeks", "Expulsion from the Dhamma School"] },
      { number: "", text: "The disciplinary board recommends the penalties listed above. They take effect only after approval by the head teacher." },
      { number: "4.2", text: "The parent or guardian acknowledges that the head teacher or another relevant teacher may apply one or more suitable penalties for a student’s wrongdoing, explain the wrongdoing to the child afterward, and that the resulting emotional impact must be accepted." },
      { number: "4.3", text: "Students who act against the school’s rules and traditions or harm its discipline or reputation, inside or outside school, may be disciplined by the head teacher and/or teaching staff. Parents may not challenge or interfere with a suitable penalty given for the student’s future wellbeing." },
      { number: "4.4", text: "Parents who wish to inquire about a penalty must do so only at the school office during school hours on a school day. They should not visit the monks’ residence to inquire about it, either at that time or at another time." },
      { number: "4.5", text: "The head teacher has full authority under these rules to make final decisions about all school activities. Students, parents and other outside parties may not influence those decisions." },
    ] },
    { number: "05", title: "Removal from school records", rules: [
      { number: "5.1", text: "If an unavoidable reason prevents a child from attending, the parent or guardian must notify the head teacher or class teacher in writing." },
      { number: "5.2", text: "If a student is absent for two consecutive weeks without prior notice or a reasonable written explanation, the school will treat the student as having left. Their name will be removed from the attendance register and other school records without prior notice. This decision will not be changed for any reason." },
    ] },
    { number: "06", title: "Leaving the school premises", rules: [
      { number: "6.1", text: "After a child is handed over to the Dhamma School on Sunday, the child may not leave before school ends except in the case of illness or an emergency." },
      { number: "6.2", text: "The mother, father or guardian whose signature appears in the student handbook must come to collect the child." },
    ] },
    { number: "07", title: "Amendment of these provisions", rules: [
      { number: "", text: "The Dhamma School administration has full authority under this written constitution to implement, amend, renew, restructure or revoke all of the above rules." },
    ] },
  ],
  declarationTitle: "Parent or guardian declaration",
  declarationBeforeName: "I declare that my child, or the child in my care, ",
  declarationAfterName: " is being enrolled in this Dhamma School after I have read and fully understood these rules. I acknowledge that they have been established for the future welfare of my child, the welfare of every other child in the school, the welfare of the institution, and the safety of all parties. I will not oppose these rules or pursue legal or political pressure or legal action against them. I sign with a clear understanding and undertake to act with a sound state of mind and bear the consequences. If I nevertheless take legal action, I declare that the relevant legal authority should regard that action as a fault on my part.",
};

export const rulesContent = { si: sinhala, en: english } as const;

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sifa database...');

  // Create hymn books
  const tmw = await prisma.hymnBook.upsert({
    where: { shortName: 'TMW' },
    update: {},
    create: {
      name: 'Tumwabudu Mungu Wetu',
      shortName: 'TMW',
      description: 'Kitabu cha nyimbo za ibada za Kikristo kinachotumika sana katika makanisa ya Tanzania na Afrika Mashariki.',
      language: 'sw',
      totalSongs: 440,
    },
  });

  const tzr = await prisma.hymnBook.upsert({
    where: { shortName: 'TZR' },
    update: {},
    create: {
      name: 'Tenzi za Rohoni',
      shortName: 'TZR',
      description: 'Mkusanyiko wa nyimbo za kiroho za sifa, ibada, na maombi kwa lugha ya Kiswahili.',
      language: 'sw',
      totalSongs: 144,
    },
  });

  // Seed TMW songs (sample of real hymns)
  const tmwSongs = [
    {
      songNumber: 1,
      title: 'Mungu Ni Mwema',
      lyrics: `1. Mungu ni mwema, Mungu ni mwema,
Mungu ni mwema, ni mwema sana.

Kiitikio:
Mungu ni mwema, ni mwema sana,
Mungu ni mwema, ni mwema kweli.

2. Yesu ni mwema, Yesu ni mwema,
Yesu ni mwema, ni mwema sana.

3. Roho ni mwema, Roho ni mwema,
Roho ni mwema, ni mwema sana.`,
      category: 'Sifa',
      theme: 'praise',
      worshipContext: 'opening',
      hasChorus: true,
      verseCount: 3,
      key: 'C',
    },
    {
      songNumber: 2,
      title: 'Bwana Yesu Karibu',
      lyrics: `1. Bwana Yesu karibu, Bwana Yesu karibu,
Tukuabudu, tukuabudu,
Bwana Yesu karibu.

2. Njoo utawale, njoo utawale,
Tukuabudu, tukuabudu,
Njoo utawale.

3. Roho Mtakatifu, Roho Mtakatifu,
Tukuabudu, tukuabudu,
Roho Mtakatifu.`,
      category: 'Ibada',
      theme: 'worship',
      worshipContext: 'opening',
      hasChorus: false,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 3,
      title: 'Hakuna Mungu Kama Wewe',
      lyrics: `1. Hakuna Mungu kama wewe,
Hakuna Mungu kama wewe,
Mbinguni na duniani,
Hakuna Mungu kama wewe.

Kiitikio:
Hakuna, hakuna, hakuna, hakuna,
Hakuna Mungu kama wewe.

2. Hakuna Bwana kama wewe,
Hakuna Bwana kama wewe,
Mbinguni na duniani,
Hakuna Bwana kama wewe.`,
      category: 'Sifa',
      theme: 'praise',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'G',
    },
    {
      songNumber: 4,
      title: 'Ni Nani Kama Bwana',
      lyrics: `1. Ni nani kama Bwana,
Ni nani kama Yesu,
Ni nani kama Mfalme wangu,
Hakuna, hakuna!

Kiitikio:
Hakuna kama Yesu, hakuna kama Yesu,
Hakuna kama Mfalme wangu,
Hakuna, hakuna!

2. Ameshinda mauti,
Ameshinda shetani,
Ameshinda nguvu za giza,
Hakuna kama Yesu!`,
      category: 'Sifa',
      theme: 'victory',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'A',
    },
    {
      songNumber: 5,
      title: 'Tumsifu Mungu Wetu',
      lyrics: `1. Tumsifu Mungu wetu,
Tumsifu kwa furaha,
Tumsifu kwa shangwe,
Yeye ndiye Bwana.

Kiitikio:
Tumsifu, tumsifu, tumsifu Mungu wetu,
Tumsifu, tumsifu, Yeye ndiye Bwana.

2. Tumshukuru Bwana,
Kwa wema wake wote,
Kwa upendo wake,
Yeye ndiye Bwana.

3. Tuminini Bwana,
Kwa nguvu zake zote,
Kwa uwezo wake,
Yeye ndiye Bwana.`,
      category: 'Sifa',
      theme: 'praise',
      worshipContext: 'opening',
      hasChorus: true,
      verseCount: 3,
      key: 'F',
    },
    {
      songNumber: 6,
      title: 'Ee Bwana Usikie Sala Yangu',
      lyrics: `1. Ee Bwana usikie sala yangu,
Ee Bwana usikie kilio changu,
Ninakuja mbele zako,
Kwa unyenyekevu mkubwa.

2. Ee Bwana unihurumie,
Ee Bwana unisamehe,
Dhambi zangu ni nyingi,
Lakini rehema yako ni kuu.

3. Ee Bwana unitakase,
Ee Bwana unioshe,
Nifanye kuwa safi,
Kama theluji nyeupe.`,
      category: 'Sala',
      theme: 'prayer',
      worshipContext: 'prayer',
      hasChorus: false,
      verseCount: 3,
      key: 'Dm',
    },
    {
      songNumber: 7,
      title: 'Neema Ya Ajabu',
      lyrics: `1. Neema ya ajabu, tamu sana,
Iliyoniokoa mimi mwenye dhambi!
Nilikuwa nimepotea, sasa nimepatikana,
Nilikuwa kipofu, sasa naona.

2. Neema ilinifundisha kuogopa,
Neema iliondoa hofu yangu;
Jinsi neema ilivyokuwa ya thamani,
Saa ile niliyoamini!

3. Kupitia hatari nyingi na taabu,
Nimekwisha kuja salama;
Neema imenileta hadi hapa,
Na neema itanipeleka nyumbani.`,
      category: 'Neema',
      theme: 'grace',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'G',
    },
    {
      songNumber: 8,
      title: 'Msalaba Wa Yesu',
      lyrics: `1. Msalaba wa Yesu ndio tumaini langu,
Msalaba wa Yesu ndio nguzo yangu,
Pale Kalvari aliteseka,
Kwa ajili yangu na wewe.

Kiitikio:
Msalaba, msalaba, msalaba wa Yesu,
Ndio tumaini la ulimwengu wote.

2. Damu yake ilitiririka,
Kwa ondoleo la dhambi zetu,
Upendo wake ni wa milele,
Hatuna budi kumshukuru.`,
      category: 'Msalaba',
      theme: 'redemption',
      worshipContext: 'communion',
      hasChorus: true,
      verseCount: 2,
      key: 'Eb',
    },
    {
      songNumber: 9,
      title: 'Yesu Ni Jiwe Kuu',
      lyrics: `1. Yesu ni jiwe kuu la pembeni,
Juu yake kanisa limejengwa,
Nguvu za kuzimu hazitashinda,
Kanisa la Bwana litasimama.

2. Yesu ni msingi wa imani yetu,
Yesu ni nguzo ya maisha yetu,
Tumjenge juu yake siku zote,
Kanisa la Bwana litasimama.

Kiitikio:
Simama, simama, kanisa la Bwana simama,
Simama, simama, juu ya mwamba imara.`,
      category: 'Kanisa',
      theme: 'church',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'Bb',
    },
    {
      songNumber: 10,
      title: 'Nitaimba Kwa Bwana',
      lyrics: `1. Nitaimba kwa Bwana,
Kwa kuwa amenitendea makuu,
Nitaimba kwa Bwana,
Kwa kuwa ni mwema.

Kiitikio:
Nitaimba, nitaimba, nitaimba kwa Bwana,
Nitaimba, nitaimba, kwa kuwa ni mwema.

2. Nitacheza kwa Bwana,
Kwa kuwa amenibariki sana,
Nitacheza kwa Bwana,
Kwa furaha yangu.

3. Nitamsifu Bwana,
Kwa kuwa amenipa uzima,
Nitamsifu Bwana,
Milele na milele.`,
      category: 'Sifa',
      theme: 'joy',
      worshipContext: 'praise',
      hasChorus: true,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 11,
      title: 'Baba Yetu',
      lyrics: `1. Baba yetu uliye mbinguni,
Jina lako litukuzwe,
Ufalme wako uje,
Mapenzi yako yatimizwe.

2. Duniani kama mbinguni,
Utupe leo riziki yetu,
Utusamehe makosa yetu,
Kama tunavyowasamehe.

3. Usitutie majaribuni,
Lakini utuokoe na yule mwovu,
Kwa kuwa ufalme ni wako,
Na nguvu na utukufu milele. Amina.`,
      category: 'Sala',
      theme: 'prayer',
      worshipContext: 'prayer',
      hasChorus: false,
      verseCount: 3,
      key: 'C',
    },
    {
      songNumber: 12,
      title: 'Tazama Pendo La Mungu',
      lyrics: `1. Tazama pendo la Mungu lilivyo kuu,
Alimtoa Mwanae wa pekee,
Ili kila amwaminiye,
Asipotee bali awe na uzima.

Kiitikio:
Pendo la Mungu, pendo la Mungu,
Lilivyo kuu, lilivyo kuu sana!

2. Ulimwengu wote Mungu alipenda,
Hakutaka hata mmoja apotee,
Neema yake inatosha wote,
Wote wamwaminiye wataokolewa.`,
      category: 'Upendo',
      theme: 'love',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'G',
    },
    {
      songNumber: 13,
      title: 'Nimekuja Mbele Zako',
      lyrics: `1. Nimekuja mbele zako, Bwana,
Moyo wangu umejaa sifa,
Nimekuja kukuabudu,
Wewe Mungu wangu.

2. Pokea sifa zangu, Bwana,
Pokea ibada yangu,
Nimekuja kwa unyenyekevu,
Mbele za kiti chako cha enzi.

3. Nifundishe njia yako, Bwana,
Niongoze katika kweli yako,
Moyo wangu uko tayari,
Kufanya mapenzi yako.`,
      category: 'Ibada',
      theme: 'surrender',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'E',
    },
    {
      songNumber: 14,
      title: 'Nguvu Za Juu',
      lyrics: `1. Nguvu za juu zinashuka sasa,
Roho Mtakatifu anakuja,
Jaza maisha yangu, Bwana,
Kwa uweza wako.

Kiitikio:
Shuka, shuka, Roho Mtakatifu shuka,
Jaza nyumba hii kwa utukufu wako.

2. Moto wa Mungu unawaka ndani,
Uwezo wake unatenda kazi,
Vipawa vyake vinagawanywa,
Kwa kanisa lake.`,
      category: 'Roho Mtakatifu',
      theme: 'holy_spirit',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'A',
    },
    {
      songNumber: 15,
      title: 'Yesu Nakupenda',
      lyrics: `1. Yesu nakupenda, Yesu nakupenda,
Kwa moyo wangu wote, nakupenda Bwana,
Hakuna mwingine kama wewe,
Yesu nakupenda.

2. Yesu nakuabudu, Yesu nakuabudu,
Kwa roho yangu yote, nakuabudu Bwana,
Hakuna mwingine kama wewe,
Yesu nakuabudu.

3. Yesu nakufuata, Yesu nakufuata,
Kwa nguvu zangu zote, nakufuata Bwana,
Popote uendapo,
Yesu nakufuata.`,
      category: 'Upendo',
      theme: 'devotion',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 16,
      title: 'Ee Mungu Nguvu Yetu',
      lyrics: `1. Ee Mungu nguvu yetu na ngome yetu,
Msaada wetu katika shida na taabu,
Hatutaogopa hata dunia ibadilishwe,
Hata milima itupwe baharini.

2. Kuna mto ambao vijito vyake vinafurahisha,
Mji mtakatifu wa Mungu Aliye Juu,
Mungu yuko katikati yake, hautatikiswa,
Mungu utausaidia alfajiri na mapema.

3. Mataifa yanafanya fujo, falme zinatikisika,
Atoa sauti yake, nchi inayeyuka,
BWANA wa majeshi yu pamoja nasi,
Mungu wa Yakobo ni ngome yetu.`,
      category: 'Tumaini',
      theme: 'refuge',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'F',
    },
    {
      songNumber: 17,
      title: 'Twende Mbele Kwa Yesu',
      lyrics: `1. Twende mbele kwa Yesu,
Asiyechoka kutulinda,
Twende mbele kwa imani,
Yeye ndiye njia yetu.

Kiitikio:
Twende, twende, twende mbele kwa Yesu,
Twende, twende, hatutarudi nyuma!

2. Vita ni vikali sana,
Lakini Yesu ni Mshindi,
Tuvae silaha zake,
Tusimame imara.

3. Mbingu ndio mwisho wetu,
Taji la uzima latungojea,
Twende mbele kwa ujasiri,
Hadi tutakapofika.`,
      category: 'Safari',
      theme: 'perseverance',
      worshipContext: 'closing',
      hasChorus: true,
      verseCount: 3,
      key: 'Bb',
    },
    {
      songNumber: 18,
      title: 'Utukufu Kwa Mungu',
      lyrics: `1. Utukufu kwa Mungu aliye juu,
Na duniani amani kwa watu,
Ambao Mungu anawapendeza,
Tunakusifu, tunakubariki.

2. Tunakuabudu, tunakutukuza,
Tunakushukuru kwa utukufu wako mkuu,
Bwana Mungu, Mfalme wa mbinguni,
Mungu Baba Mwenyezi.

3. Bwana, Mwana wa pekee, Yesu Kristo,
Bwana Mungu, Mwana-Kondoo wa Mungu,
Mwana wa Baba, unayeiondoa dhambi ya ulimwengu,
Utuhurumie.`,
      category: 'Ibada',
      theme: 'glory',
      worshipContext: 'opening',
      hasChorus: false,
      verseCount: 3,
      key: 'C',
    },
    {
      songNumber: 19,
      title: 'Mimi Ni Mtu Mdogo',
      lyrics: `1. Mimi ni mtu mdogo,
Lakini Mungu wangu ni mkubwa,
Mimi ni dhaifu,
Lakini Mungu wangu ana nguvu.

Kiitikio:
Mungu wangu ni mkubwa, ni mkubwa sana,
Hakuna kitu kigumu kwake,
Mungu wangu ni mkubwa!

2. Mimi sina uwezo,
Lakini Roho wake ananipa,
Mimi sina hekima,
Lakini neno lake lanifundisha.`,
      category: 'Imani',
      theme: 'faith',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'G',
    },
    {
      songNumber: 20,
      title: 'Njoo Kwangu',
      lyrics: `1. Njoo kwangu, ninyi nyote msumbukao,
Na wenye kulemewa na mizigo,
Nami nitawapumzisha,
Asema Bwana.

2. Jifunzeni kwangu,
Kwa kuwa mimi ni mpole,
Na mnyenyekevu wa moyo,
Mtapata raha nafsini mwenu.

3. Kwa maana nira yangu ni laini,
Na mzigo wangu ni mwepesi,
Njoo kwangu, njoo kwangu,
Asema Bwana.`,
      category: 'Faraja',
      theme: 'comfort',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'Eb',
    },
    {
      songNumber: 21,
      title: 'Asante Yesu',
      lyrics: `1. Asante Yesu, asante Yesu,
Kwa yote uliyonifanyia,
Asante Yesu, asante Yesu,
Milele nitakushukuru.

2. Umeniponya, umeniponya,
Kutoka katika dhambi zangu,
Umeniponya, umeniponya,
Milele nitakushukuru.

3. Umenilinda, umenilinda,
Katika njia zangu zote,
Umenilinda, umenilinda,
Milele nitakushukuru.`,
      category: 'Shukrani',
      theme: 'thanksgiving',
      worshipContext: 'thanksgiving',
      hasChorus: false,
      verseCount: 3,
      key: 'F',
    },
    {
      songNumber: 22,
      title: 'Siku Njema',
      lyrics: `1. Siku njema asubuhi na mapema,
Nimemwona Yesu Bwana wangu,
Amenipa furaha moyoni mwangu,
Siku njema, siku njema!

Kiitikio:
Siku njema, siku njema, siku njema,
Kwa kuwa Yesu yu nami!

2. Siku njema mchana na jioni,
Yesu hajaniacha peke yangu,
Amenishika mkono wake wa kuume,
Siku njema, siku njema!`,
      category: 'Furaha',
      theme: 'joy',
      worshipContext: 'opening',
      hasChorus: true,
      verseCount: 2,
      key: 'A',
    },
    {
      songNumber: 23,
      title: 'Mchungaji Mwema',
      lyrics: `1. Bwana ndiye mchungaji wangu,
Sitapungukiwa na kitu,
Hunilaza penye majani mabichi,
Huniongoza penye maji ya utulivu.

2. Huniburudisha nafsi yangu,
Huniongoza katika njia za haki,
Kwa ajili ya jina lake,
Bwana ni mchungaji wangu.

3. Naam, nijapopita katika bonde la uvuli wa mauti,
Sitaogopa mabaya,
Kwa maana wewe upo pamoja nami,
Gongo lako na fimbo yako vinanifariji.`,
      category: 'Tumaini',
      theme: 'guidance',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 24,
      title: 'Hosana Mbinguni',
      lyrics: `1. Hosana, hosana, hosana mbinguni!
Hosana, hosana, hosana mbinguni!
Bwana anakuja, Mfalme wa utukufu,
Hosana, hosana, hosana mbinguni!

2. Msifuni, msifuni, msifuni Bwana!
Msifuni, msifuni, msifuni Bwana!
Kwa sauti kubwa tumsifu Mungu wetu,
Msifuni, msifuni, msifuni Bwana!

3. Ameshinda, ameshinda, Simba wa Yuda!
Ameshinda, ameshinda, Simba wa Yuda!
Mauti ameshinda, kaburi ameshinda,
Ameshinda, ameshinda, Simba wa Yuda!`,
      category: 'Sifa',
      theme: 'triumph',
      worshipContext: 'praise',
      hasChorus: false,
      verseCount: 3,
      key: 'G',
    },
    {
      songNumber: 25,
      title: 'Nibadilishe Bwana',
      lyrics: `1. Nibadilishe Bwana, nibadilishe,
Nifanye upya, kwa Roho wako,
Ondoa yote ya kale ndani yangu,
Nibadilishe Bwana.

2. Nijaze Bwana, nijaze,
Kwa upendo wako na neema yako,
Nijaze kwa uwezo wako,
Nijaze Bwana.

3. Nitumie Bwana, nitumie,
Katika kazi yako duniani,
Nitume niende popote,
Nitumie Bwana.`,
      category: 'Kujitolea',
      theme: 'transformation',
      worshipContext: 'altar_call',
      hasChorus: false,
      verseCount: 3,
      key: 'C',
    },
  ];

  // Seed TZR songs
  const tzrSongs = [
    {
      songNumber: 1,
      title: 'Yesu Ni Wangu',
      lyrics: `1. Yesu ni wangu, mimi ni wake,
Amenikomboa kwa damu yake,
Roho wake anakaa ndani yangu,
Yesu ni wangu milele.

Kiitikio:
Yesu ni wangu, mimi ni wake,
Siku zote za maisha yangu,
Yesu ni wangu, mimi ni wake,
Milele na milele. Amina.

2. Ulimwengu huu si makao yangu,
Mbingu ndio nyumba yangu ya kweli,
Nasafiri kuelekea kwake,
Yesu ni wangu milele.`,
      category: 'Uhakika',
      theme: 'assurance',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'G',
    },
    {
      songNumber: 2,
      title: 'Nakuamini Bwana',
      lyrics: `1. Nakuamini Bwana, kwa moyo wangu wote,
Sitegemei akili yangu mwenyewe,
Katika njia zangu zote nakukubali,
Nawe utanyoosha mapito yangu.

2. Nakuamini Bwana, ingawa sioni,
Njia uliyonipangia ni njema,
Wewe unajua mwisho tangu mwanzo,
Nakuamini Bwana.

3. Nakuamini Bwana, katika shida na raha,
Wewe ni mwamba wangu na ngome yangu,
Kamwe hutaniacha wala kunisahau,
Nakuamini Bwana.`,
      category: 'Imani',
      theme: 'trust',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 3,
      title: 'Mwamba Wangu',
      lyrics: `1. Mwamba wangu, ngome yangu,
Mahali pangu pa kujificha,
Katika dhoruba na tufani,
Wewe ni kimbilio langu.

Kiitikio:
Wewe ni mwamba wangu,
Wewe ni ngome yangu,
Katika wewe ninajificha,
Mwamba wa milele.

2. Juu ya mwamba huu nasimama,
Miguu yangu iko imara,
Mawimbi yakipiga kwa nguvu,
Mwamba wangu hautasogea.`,
      category: 'Tumaini',
      theme: 'refuge',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'Bb',
    },
    {
      songNumber: 4,
      title: 'Bwana U Sehemu Yangu',
      lyrics: `1. Bwana u sehemu yangu,
U fungu la urithi wangu,
Kombe la baraka zangu,
Wewe ndiwe yote kwangu.

2. Mipaka yangu imeangukia
Mahali pazuri sana,
Naam, nina urithi mzuri,
Ninamshukuru Bwana.

3. Nitamhimidi Bwana anishauri,
Usiku moyo wangu wanifundisha,
Nimemweka Bwana mbele yangu daima,
Kwa kuwa yuko kuume kwangu, sitatikiswa.`,
      category: 'Kuridhika',
      theme: 'contentment',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'E',
    },
    {
      songNumber: 5,
      title: 'Upendo Wa Yesu',
      lyrics: `1. Upendo wa Yesu ni wa ajabu,
Upana na urefu na kina chake,
Hauwezi kupimwa na mtu yeyote,
Upendo wa Yesu ni wa milele.

Kiitikio:
Upendo, upendo, upendo wa Yesu,
Ni mkubwa kuliko yote duniani,
Upendo, upendo, upendo wa Yesu,
Ni wa milele, ni wa milele.

2. Upendo huu ulinisaka mimi,
Nilipokuwa bado mwenye dhambi,
Upendo huu ulinigusa moyo,
Na kunibadilisha kabisa.

3. Upendo huu hauniachi kamwe,
Katika furaha na katika huzuni,
Upendo huu utanishika mkono,
Hadi nitakapofika mbinguni.`,
      category: 'Upendo',
      theme: 'love',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 3,
      key: 'F',
    },
    {
      songNumber: 6,
      title: 'Ni Wewe Peke Yako',
      lyrics: `1. Ni wewe peke yako unayestahili,
Sifa na utukufu na heshima,
Ni wewe peke yako Mungu wa kweli,
Tunakuabudu.

2. Ni wewe peke yako uliyeumba,
Mbingu na nchi na vyote vilivyomo,
Ni wewe peke yako una mamlaka,
Tunakuabudu.

3. Ni wewe peke yako uliyetuokoa,
Kwa damu ya Mwanao mpendwa,
Ni wewe peke yako unayetustahili,
Tunakuabudu.`,
      category: 'Ibada',
      theme: 'worship',
      worshipContext: 'worship',
      hasChorus: false,
      verseCount: 3,
      key: 'C',
    },
    {
      songNumber: 7,
      title: 'Roho Mtakatifu Njoo',
      lyrics: `1. Roho Mtakatifu njoo,
Jaza maisha yetu,
Tupe nguvu za kutembea,
Katika njia ya Bwana.

Kiitikio:
Njoo Roho, njoo Roho,
Roho Mtakatifu njoo,
Tunahitaji uwepo wako,
Roho Mtakatifu njoo.

2. Roho Mtakatifu njoo,
Tufundishe kweli yako,
Tupe hekima na ufahamu,
Katika neno la Mungu.

3. Roho Mtakatifu njoo,
Tufariji na kutia nguvu,
Katika nyakati za shida,
Uwe msaidizi wetu.`,
      category: 'Roho Mtakatifu',
      theme: 'holy_spirit',
      worshipContext: 'invocation',
      hasChorus: true,
      verseCount: 3,
      key: 'Am',
    },
    {
      songNumber: 8,
      title: 'Neno La Mungu',
      lyrics: `1. Neno la Mungu ni taa ya miguu yangu,
Na mwanga wa njia yangu,
Linanifundisha na kuniongoza,
Katika maisha yangu yote.

2. Neno la Mungu ni hai na lenye nguvu,
Kuliko upanga wenye makali kuwili,
Linapenyeza hadi kugawanya roho na mwili,
Na kutambua nia za moyo.

3. Neno la Mungu litadumu milele,
Mbingu na nchi zitapita,
Lakini neno lake halitapita kamwe,
Litadumu milele na milele.`,
      category: 'Neno',
      theme: 'scripture',
      worshipContext: 'teaching',
      hasChorus: false,
      verseCount: 3,
      key: 'D',
    },
    {
      songNumber: 9,
      title: 'Furaha Yangu',
      lyrics: `1. Furaha yangu ni Yesu Kristo,
Amani yangu ni Yesu Kristo,
Nguvu yangu ni Yesu Kristo,
Yeye ni yote kwangu.

Kiitikio:
Furaha, furaha, furaha yangu ni Yesu,
Amani, amani, amani yangu ni Yesu,
Yeye ni yote kwangu!

2. Tumaini langu ni Yesu Kristo,
Msaada wangu ni Yesu Kristo,
Mwokozi wangu ni Yesu Kristo,
Yeye ni yote kwangu.`,
      category: 'Furaha',
      theme: 'joy',
      worshipContext: 'praise',
      hasChorus: true,
      verseCount: 2,
      key: 'G',
    },
    {
      songNumber: 10,
      title: 'Tutakapokutana',
      lyrics: `1. Tutakapokutana huko mbinguni,
Furaha yetu itakuwa kubwa sana,
Hatutalia tena, hatutahuzunika,
Tutakapokutana na Bwana.

2. Tutakapokutana na wapendwa wetu,
Ambao walitutangulia kwa Bwana,
Tutashangilia pamoja milele,
Tutakapokutana huko mbinguni.

3. Tutakapokutana mbele za kiti cha enzi,
Tutamsifu Mwana-Kondoo wa Mungu,
Tutaimba wimbo mpya wa ukombozi,
Milele na milele. Amina.`,
      category: 'Mbingu',
      theme: 'heaven',
      worshipContext: 'closing',
      hasChorus: false,
      verseCount: 3,
      key: 'Eb',
    },
    {
      songNumber: 11,
      title: 'Nipe Moyo Safi',
      lyrics: `1. Nipe moyo safi, Ee Mungu,
Na roho mpya uifanye ndani yangu,
Usinilipe mbali na uso wako,
Wala Roho wako Mtakatifu usiniondolee.

2. Unirudishie furaha ya wokovu wako,
Na roho ya utii initegemeze,
Nitawafundisha wakosaji njia zako,
Na wenye dhambi watarejea kwako.

3. Dhabihu ya Mungu ni roho iliyovunjika,
Moyo uliovunjika na kupondeka,
Ee Mungu, hutaudharau,
Nipe moyo safi.`,
      category: 'Toba',
      theme: 'repentance',
      worshipContext: 'prayer',
      hasChorus: false,
      verseCount: 3,
      key: 'Dm',
    },
    {
      songNumber: 12,
      title: 'Bariki Afrika',
      lyrics: `1. Mungu ibariki Afrika,
Utukufu wake uangaze,
Usikie maombi yetu,
Mungu ibariki, Mungu ibariki.

2. Mungu ibariki Afrika,
Ondoa vita na dhuluma,
Leta amani na upendo,
Mungu ibariki Afrika.

3. Mungu ibariki Afrika,
Watoto wake uwalinde,
Katika njia zao zote,
Mungu ibariki Afrika.`,
      category: 'Taifa',
      theme: 'nation',
      worshipContext: 'intercession',
      hasChorus: false,
      verseCount: 3,
      key: 'F',
    },
    {
      songNumber: 13,
      title: 'Kama Ayala',
      lyrics: `1. Kama ayala aioneavyo maji ya kijito,
Ndivyo nafsi yangu inavyokuonea wewe, Mungu,
Nafsi yangu inamwonea kiu Mungu,
Mungu aliye hai.

Kiitikio:
Nafsi yangu inamwonea kiu Mungu,
Mungu aliye hai,
Lini nitakwenda nikaonekane
Mbele za Mungu?

2. Machozi yangu yamekuwa chakula changu,
Mchana na usiku,
Watu waniambiapo kila siku,
Yuko wapi Mungu wako?`,
      category: 'Kiu',
      theme: 'longing',
      worshipContext: 'worship',
      hasChorus: true,
      verseCount: 2,
      key: 'A',
    },
    {
      songNumber: 14,
      title: 'Shukrani Kwa Bwana',
      lyrics: `1. Shukrani kwa Bwana, kwa wema wake,
Shukrani kwa Bwana, kwa upendo wake,
Kwa yote aliyotutendea,
Tunashukuru, tunashukuru.

2. Kwa pumzi ya uhai, tunashukuru,
Kwa chakula na mavazi, tunashukuru,
Kwa familia na marafiki,
Tunashukuru, tunashukuru.

3. Kwa wokovu wa Yesu, tunashukuru,
Kwa Roho Mtakatifu, tunashukuru,
Kwa maisha ya milele,
Tunashukuru, tunashukuru.`,
      category: 'Shukrani',
      theme: 'thanksgiving',
      worshipContext: 'thanksgiving',
      hasChorus: false,
      verseCount: 3,
      key: 'C',
    },
    {
      songNumber: 15,
      title: 'Msalaba Unanibeba',
      lyrics: `1. Msalaba unanibeba kuelekea mbinguni,
Njia ni ngumu lakini Bwana yu nami,
Sichoki kubeba msalaba wangu,
Kwa maana Yesu alibeba wake kwa ajili yangu.

2. Msalaba unanifundisha kupenda,
Kupenda hata adui zangu,
Msalaba unanifundisha kusamehe,
Kama Bwana alivyonisamehe.

3. Msalaba ni ushindi wangu,
Kwa msalaba nimeshinda ulimwengu,
Msalaba ni utukufu wangu,
Milele nitajisifu kwa msalaba wa Bwana.`,
      category: 'Msalaba',
      theme: 'cross',
      worshipContext: 'communion',
      hasChorus: false,
      verseCount: 3,
      key: 'G',
    },
  ];

  // Insert TMW songs
  for (const songData of tmwSongs) {
    await prisma.song.upsert({
      where: {
        hymnBookId_songNumber: {
          hymnBookId: tmw.id,
          songNumber: songData.songNumber,
        },
      },
      update: {},
      create: {
        ...songData,
        hymnBookId: tmw.id,
        language: 'sw',
      },
    });
  }

  // Insert TZR songs
  for (const songData of tzrSongs) {
    await prisma.song.upsert({
      where: {
        hymnBookId_songNumber: {
          hymnBookId: tzr.id,
          songNumber: songData.songNumber,
        },
      },
      update: {},
      create: {
        ...songData,
        hymnBookId: tzr.id,
        language: 'sw',
      },
    });
  }

  // Create demo admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@sifa.app' },
    update: {},
    create: {
      email: 'admin@sifa.app',
      passwordHash: adminHash,
      displayName: 'Sifa Admin',
      role: 'admin',
      language: 'sw',
    },
  });

  // Create demo user
  const userHash = await bcrypt.hash('user123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@sifa.app' },
    update: {},
    create: {
      email: 'demo@sifa.app',
      passwordHash: userHash,
      displayName: 'Demo User',
      role: 'user',
      language: 'sw',
    },
  });

  const tmwCount = await prisma.song.count({ where: { hymnBookId: tmw.id } });
  const tzrCount = await prisma.song.count({ where: { hymnBookId: tzr.id } });
  const userCount = await prisma.user.count();

  console.log(`✅ Seeded ${tmwCount} TMW songs`);
  console.log(`✅ Seeded ${tzrCount} TZR songs`);
  console.log(`✅ Created ${userCount} users`);
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

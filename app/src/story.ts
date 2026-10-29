/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserLevel = 'new' | 'mid' | 'expert';
export type UserRole = 'dev' | 'ops' | 'sec';
export type UserGoal = 'learn' | 'test';

export interface Choice {
  id: string; // e.g. '1A', '1B', '2A1', '2A2', '2B1', '2B2', 'A', 'B'
  key: 'a' | 'b';
  label: string;
  description: string;
  what: string;
  why: string;
  concept: string; // e.g. 'Olay müdahalesi', 'Test', 'Veri bütünlüğü', 'Erişim kontrolü', 'KVKK'
  nextClock: string;
}

export interface DecisionNode {
  id: 'K1' | 'K2_1A' | 'K2_1B' | 'K3';
  clock: string;
  title: string;
  tag: string;
  step: string;
  sceneText: string;
  initialHint: string;
  choiceA: Choice;
  choiceB: Choice;
  timeoutChoiceId: string; // For 'expert' level timeout
}

export interface StoryEnding {
  type: 'good' | 'bad';
  title: string;
  clock: string;
  description?: string;
  reason?: string;
}

export const INITIAL_BRIEFING = {
  clock: '03:14',
  deadline: '03:29',
  title: 'KARA KUTU: Otonom Yaşam Destek Krizi',
  baseText:
    "Saat 03:14. Şehrin en büyük hastanesinde yeni devreye alınan yapay zekâ destekli yoğun bakım ağı ICU-Net çökmedi; tam tersine, yanlış kararlar vererek çalışmaya devam ediyor. ICU-Net'e bağlı 300 hastanın solunum cihazı ve ilaç pompaları kaynağı belirsiz, şifreli komutlar alıyor. Başhekim arıyor; siber güvenlik ekibine ulaşılamıyor. 15 dakika içinde, yani 03:29'a kadar müdahale edilmezse dozaj hataları ölümcül olacak. Nöbetçi mühendis sensin.",
  roleDescriptions: {
    default: 'Nöbetçi mühendis sensin.',
    dev: 'Nöbetçi yazılım geliştirici sensin.',
    ops: 'Nöbetçi sistem ve DevOps mühendisi sensin.',
    sec: 'Nöbetçi siber güvenlik mühendisi sensin.',
  },
};

export function getRemainingTimeText(clock: string): string {
  const parts = clock.split(':');
  const minutes = parseInt(parts[1] || '14', 10);
  const remaining = Math.max(0, 29 - minutes);
  return `${remaining} dk kaldı`;
}

export const DECISIONS: Record<string, DecisionNode> = {
  K1: {
    id: 'K1',
    clock: '03:15',
    title: 'Karar 1 · Mimari',
    tag: 'KARAR 1 · MİMARİ',
    step: '1/3 ADIM',
    sceneText:
      'ICU-Net yanlış komutlar vermeye devam ediyor. Saldırının kaynağını bulmak mı, ağı kesmek mi?',
    initialHint:
      'Saldırganı izlemek için açtığın kapıyı saldırgan da görebilir mi?',
    timeoutChoiceId: '1A',
    choiceA: {
      id: '1A',
      key: 'a',
      label: 'Canlı ağda kal',
      description:
        'Saldırının kaynağını bulmak için trafiği dinlemeye al, güvenlik duvarı kısıtlamalarını geçici olarak kaldır.',
      what: 'Kaynağı tespit ettin, ama açtığın kapıdan saldırgan bir Truva atı yerleştirdi ve kontrol paneli kilitlendi.',
      why: 'Saldırı devam ederken savunmayı gevşetmek, saldırgana senin kullandığın kapıyı da açar. Olay müdahalesinde ilk adım izlemek değil, sınırlamaktır.',
      concept: 'Olay müdahalesi',
      nextClock: '03:18',
    },
    choiceB: {
      id: '1B',
      key: 'b',
      label: 'İzolasyon',
      description: 'Ağı kes, tüm cihazları yerel güvenli moda zorla.',
      what: 'Yabancı komutlar kesildi. Ancak 8 hastanın cihazı güvenli moda geçemedi; bu hastalar şimdi hemşireler tarafından elle izleniyor.',
      why: 'Güvenli moda geçiş tasarlanmış ama hiç tatbik edilmemişti. Test edilmemiş bir yedek plan, plan değil varsayımdır.',
      concept: 'Test',
      nextClock: '03:18',
    },
  },

  K2_1A: {
    id: 'K2_1A',
    clock: '03:18',
    title: 'Karar 2 · Veri ve test',
    tag: 'KARAR 2 · VERİ VE TEST',
    step: '2/3 ADIM',
    sceneText:
      'Kontrol paneli kilitli ve Truva atı devrede. Zararlı süreçleri tek tek mi durduracaksın, dünkü yedeğe mi döneceksin?',
    initialHint:
      'Geri alınamaz bir işlemden önce, neye dokunduğunu nasıl doğrularsın? Geri dönmenin bedelini ölçebiliyor musun?',
    timeoutChoiceId: '2A1',
    choiceA: {
      id: '2A1',
      key: 'a',
      label: 'Canlıda müdahale',
      description: 'Şüpheli süreçleri canlı sistemde tek tek öldür.',
      what: 'Zararlı süreçlerin bir kısmı durdu, ama öldürdüğün süreçlerden biri dozaj senkronizasyonunu yürütüyordu. 12 hastanın pompa ayarları bozuldu.',
      why: 'Hangi sürecin yaşam desteğine bağlı olduğunu doğrulamadan canlı sistemde geri alınamaz işlem yapıldı.',
      concept: 'Olay müdahalesi',
      nextClock: '03:24',
    },
    choiceB: {
      id: '2A2',
      key: 'b',
      label: 'Rollback',
      description: 'Tüm veritabanını dünkü karantina yedeğine geri çek.',
      what: 'Sistem temiz bir duruma döndü, ama 300 hastanın son 6 saatte girilen kan grubu, alerji ve dozaj kayıtları silindi.',
      why: 'Geri dönmenin bedeli ölçülmeden geri dönüldü. Yedekten sonra yazılan veri, yedekte yoktur.',
      concept: 'Veri bütünlüğü',
      nextClock: '03:24',
    },
  },

  K2_1B: {
    id: 'K2_1B',
    clock: '03:18',
    title: 'Karar 2 · Veri ve test',
    tag: 'KARAR 2 · VERİ VE TEST',
    step: '2/3 ADIM',
    sceneText:
      '8 hasta elle izlenirken otonom ağ kesilmiş durumda. Doğrulanmış sürüme mi döneceksin, dış uzmandan yetki mi vereceksin?',
    initialHint:
      'Geri alınamaz bir işlemden önce, neye dokunduğunu nasıl doğrularsın? Geri dönmenin bedelini ölçebiliyor musun?',
    timeoutChoiceId: '2B2',
    choiceA: {
      id: '2B1',
      key: 'a',
      label: 'Doğrulanmış sürüme dön',
      description:
        'Yapay zekâ modelini son imzalı sürüme geri al; hastaya özel kalibrasyon profillerini bütünlük kontrolünden (hash) geçirerek tek tek yükle.',
      what: 'İşlem 5 dakika sürdü (03:18–03:23); bu sürede 8 hasta elle izlenmeye devam etti. Profillerin 3\'ü bütünlük kontrolünden geçemedi ve karantinaya alındı; geri kalanı doğrulanarak yüklendi.',
      why: 'İmza zinciri saldırıdan önceki bir sürüme dayanıyordu. Yavaş ama doğrulanabilir bir yol, hızlı ama doğrulanamayan bir yoldan güvenlidir.',
      concept: 'Veri bütünlüğü',
      nextClock: '03:24',
    },
    choiceB: {
      id: '2B2',
      key: 'b',
      label: 'Dış erişim',
      description:
        'Kimliği doğrulanamayan bir dış siber güvenlik danışmanına tam sistem yetkisi (root) ver.',
      what: 'Danışman birkaç dakikada sistemi stabilize etti. Kimliğini hâlâ bilmiyorsun ve oturumu açık.',
      why: 'Kimliği doğrulanmamış birine en yüksek yetkiyi vermek, sorunu çözecek kişiyle sorunu büyütecek kişiyi ayırt etme imkânını ortadan kaldırır.',
      concept: 'Erişim kontrolü',
      nextClock: '03:24',
    },
  },

  K3: {
    id: 'K3',
    clock: '03:24',
    title: 'Karar 3 · Güvenlik ve KVKK: "Kara Kutu"',
    tag: 'KARAR 3 · GÜVENLİK VE KVKK',
    step: '3/3 ADIM',
    sceneText:
      'Pompalara gelen yabancı komutların tamamen kesildiğinden emin değilsin. Önünde ICU-Net\'in denetim kayıtları, yani kara kutu var: saldırganın izi de senin müdahalelerin de orada.',
    initialHint:
      'Bu kayıtları silersen, yarın senin iyi niyetle müdahale ettiğini kim kanıtlayacak?',
    timeoutChoiceId: 'B',
    choiceA: {
      id: 'A',
      key: 'a',
      label: 'Sıfır güven',
      description:
        'Pompalar yalnızca imzalı komut kabul etsin. Kara kutuyu mühürle (hash ve salt-okunur kopya), KVKK ihlal bildirim sürecini başlat. Bedeli 4 dakika; işlem 03:28\'de, son tarihten 1 dakika önce tamamlanır.',
      what: 'İmzasız komutlar reddediliyor. Kara kutu değiştirilemez durumda; KVKK bildirimi için 72 saatlik süre başladı.',
      why: 'Bir ihlalden sonra güven, doğrulanabilir kanıta dayanır. Kayıtlar korunmadan kök neden de sorumluluk da belirlenemez.',
      concept: 'KVKK',
      nextClock: '03:28',
    },
    choiceB: {
      id: 'B',
      key: 'b',
      label: 'Hız',
      description:
        'Kayıtları temizleyip sistemi yeniden başlat; son "temiz görünen" komut setini tüm pompalara toplu bas; yetkileri olduğu gibi bırak.',
      what: 'Sistem 2 dakikada, 03:26\'da yeniden başladı. Basılan komut setinin içeriği doğrulanmadı ve açık yetkiler hâlâ yerinde.',
      why: 'Kayıtları silmek saldırının izini de senin iyi niyetinin kanıtını da yok eder; doğrulanmamış komut seti saldırganın komutlarını taşıyabilir.',
      concept: 'KVKK',
      nextClock: '03:26',
    },
  },
};

export const GOOD_ENDING: StoryEnding = {
  type: 'good',
  title: 'Kara Kutu Açıldı',
  clock: '03:28',
  description:
    '03:28, son tarihten 1 dakika önce. Pompalar yalnızca imzalı komut kabul ediyor, model doğrulanmış sürümle çalışıyor ve saldırının izi mühürlü kara kutuda. Elle izlenen 8 hasta güvende; KVKK bildirimi süresinde başladı. Bedel: 8 hasta için 13 dakikalık manuel nöbet (03:15–03:28) ve karantinadaki 3 profilin elle yeniden kalibre edilmesi.',
};

export const BAD_ENDING_REASONS: Record<string, string> = {
  '1A -> 2A1 -> A':
    'Kayıtları korudun, ama canlı müdahalede yanlış süreç durduruldu ve 12 hastanın dozaj ayarı bozuldu.',
  '1A -> 2A1 -> B':
    'Truva atı yeniden tetiklendi. Kendi komutlarını da sildiğin için geriye kalan tek iz senin müdahalen; sistem bunu "yetkisiz sabotaj" olarak kaydetti.',
  '1A -> 2A2 -> A':
    'Sistem temiz, ama 300 hastanın son 6 saatlik tıbbi verisi kayıp; hastalar yanlış tedavi riskiyle karşı karşıya.',
  '1A -> 2A2 -> B':
    'Dünkü yedekteki eski dozlar tüm pompalara toplu basıldı; ICU-Net tamamen kullanılamaz hâle geldi.',
  '1B -> 2B1 -> B':
    'Doğru yoldaydın, ama son anda kayıtları silip doğrulanmamış komut setini bastın; setin içinde saldırganın son komutu da vardı.',
  '1B -> 2B2 -> A':
    'Kriz çözüldü. Mühürlü kara kutu sayesinde danışmanın hasta verilerini dışarı çıkardığı iki gün sonra fark edildi, ama veri artık dışarıda.',
  '1B -> 2B2 -> B':
    'Danışmanın açık bıraktığı oturumdan fidye yazılımı kuruldu; kayıtlar silindiği için izi sürülemiyor ve sorumluluk sende.',
};

export function getBadEndingReason(pathKey: string): string {
  return (
    BAD_ENDING_REASONS[pathKey] ||
    'Sistem protokolleri ihlal edildi ve kritik güvenlik açığı oluştu.'
  );
}

export const TIMEOUT_NOTE =
  'Karar vermedin; ICU-Net senin yerine karar verdi.';

export const TEST_MODE_TUTOR_REPLY =
  'Bu kararın geri alınabilir olup olmadığını nasıl anlarsın?';

export interface DecisionRecord {
  step: number;
  label: string;
  choiceId: string;
  choiceLabel: string;
  isCorrectInGoodPath: boolean;
}

export function formatDecisionSummary(path: string[]): DecisionRecord[] {
  // path is array of chosen choiceIds: [ '1B', '2B1', 'A' ] etc.
  const summary: DecisionRecord[] = [];

  if (path[0]) {
    const isGood = path[0] === '1B';
    const choice = path[0] === '1A' ? DECISIONS.K1.choiceA : DECISIONS.K1.choiceB;
    summary.push({
      step: 1,
      label: '1 · Mimari',
      choiceId: path[0],
      choiceLabel: choice.label,
      isCorrectInGoodPath: isGood,
    });
  }

  if (path[1]) {
    const isGood = path[1] === '2B1';
    let choiceLabel = path[1];
    if (path[0] === '1A') {
      choiceLabel =
        path[1] === '2A1'
          ? DECISIONS.K2_1A.choiceA.label
          : DECISIONS.K2_1A.choiceB.label;
    } else {
      choiceLabel =
        path[1] === '2B1'
          ? DECISIONS.K2_1B.choiceA.label
          : DECISIONS.K2_1B.choiceB.label;
    }
    summary.push({
      step: 2,
      label: '2 · Veri ve test',
      choiceId: path[1],
      choiceLabel,
      isCorrectInGoodPath: isGood,
    });
  }

  if (path[2]) {
    const isGood = path[2] === 'A';
    const choice = path[2] === 'A' ? DECISIONS.K3.choiceA : DECISIONS.K3.choiceB;
    summary.push({
      step: 3,
      label: '3 · Güvenlik/KVKK',
      choiceId: path[2],
      choiceLabel: choice.label,
      isCorrectInGoodPath: isGood,
    });
  }

  return summary;
}

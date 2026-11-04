/**
 * Uyarlama metinleri (spec.md §14). Destek soruları tutor kurallarına (§7) uyar:
 * doğru seçeneği söylemez, seçenekleri sıralamaz, soruyla biter.
 */
export const ADAPTIVE_NOTE = 'Önceki kararlarına göre ek açıklama eklendi.';

export const SUPPORT_BY_DECISION: Record<string, string> = {
  K1: 'Bu karar saldırıyı sınırlamak ile onu anlamak arasında. Her seçenekte ilk dakikalarda hastalar için hangi risk açık kalır?',
  K2_1A: 'İki seçenek de geri alınamaz sonuçlar doğurabilir. Her biri için, uygulamadan önce neye dokunacağını ve neyi kaybedebileceğini nasıl ölçersin?',
  K2_1B: 'Bu kararda hız ile doğrulanabilirlik karşı karşıya. Her seçenek için, işlem bittiğinde sistemin güvenilir olduğunu hangi kanıtla gösterebilirsin?',
  K3: 'Kriz bittiğinde müdahaleni ve saldırının izini kim, hangi kayıtla inceleyecek? Her seçeneğin harcadığı süre karşılığında ne kazandırdığını nasıl tartarsın?',
};

export const RECAP_BY_CONCEPT: Record<string, { title: string; text: string }> = {
  'Olay müdahalesi': {
    title: 'Olay müdahalesinin sırası',
    text: 'Olay müdahalesi genelde tespit, sınırlama, temizleme, kurtarma ve ders çıkarma adımlarıyla ilerler. Sınırlama yapılmadan derin analize geçmek saldırıya yayılma zamanı tanır. Canlı sistemde etkisi doğrulanmadan yapılan bir işlem geri alınamayabilir.',
  },
  Test: {
    title: 'Tatbik edilmemiş plan',
    text: 'Bir yedek plan ancak tatbik edildiğinde plandır. Güvenli mod ve felaket kurtarma senaryoları düzenli test edilmezse kriz anında ilk kez çalıştırılır. Test, "çalışmalı" varsayımını "çalıştığını gördük" kanıtına çevirir.',
  },
  'Veri bütünlüğü': {
    title: 'Geri dönmenin bedeli',
    text: 'Yedeğe dönmek, yedekten sonra yazılan veriyi kaybettirir; bu kaybın üst sınırı önceden bilinmelidir. İmza ve hash, verinin ve yazılımın değişmediğini doğrulamanın yollarıdır. Doğrulanamayan hızlı bir geri dönüş, doğrulanabilir yavaş bir dönüşten daha risklidir.',
  },
  'Erişim kontrolü': {
    title: 'En az ayrıcalık',
    text: 'Herkes işini yapacak kadar yetkiye sahip olmalı, fazlasına değil. Kimliği doğrulanmamış birine yetki vermek, kurtarıcıyı saldırgandan ayırt etme imkânını ortadan kaldırır. Acil durumda bile yetki geçici, sınırlı ve izlenebilir olmalıdır.',
  },
  KVKK: {
    title: 'Kanıt ve bildirim',
    text: 'KVKK kapsamında veri ihlali, öğrenildikten sonra en geç 72 saat içinde Kurul\'a bildirilir. Denetim kayıtları hem saldırının izini hem de müdahalenin iyi niyetini kanıtlar; silinirse ikisi birden kaybolur. Kayıtları mühürlemek (hash ve salt-okunur kopya) kanıt zincirini korur.',
  },
};

export const SUPPORT_COUNTDOWN_SECONDS = 90;
export const STANDARD_COUNTDOWN_SECONDS = 60;

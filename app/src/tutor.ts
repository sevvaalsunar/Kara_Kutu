import { DecisionNode } from './story';

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('tr-TR')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ');

export function getLocalTutorReply(decision: DecisionNode, message: string): string {
  const text = normalize(message);

  if (/neden|ne demek|acikla/.test(text)) {
    if (/imza/.test(text)) {
      return 'İmzalı sürüm, yazılımın değiştirilmeden önce güvenilir bir kaynak tarafından onaylandığını gösterir. Peki imzayı doğrulayan kişi veya sistem bu sürümün kaynağını da doğrulayabiliyor mu?';
    }
    if (/hash/.test(text)) {
      return 'Hash değeri dosyanın dijital parmak izidir. Dosya değiştiğinde değer de değişir. İmza ve hash birlikte, sürümün hem kaynağını hem değiştirilmediğini kontrol etmene yardım eder mi?';
    }
  }
  if (/uzun|4 dakika|gecikme|latency/.test(text)) {
    return 'Bu 4 dakikalık gecikmenin hastaların yaşam destek cihazlarına anlık etkisini düşünüyorsun. Güvenliği zayıflatmadan müdahale süresini kısaltmak için hangi güvenli geçici kontrole başvurabilirsin?';
  }
  if (/yerel mod|cihazlar|gecm|cok/.test(text)) {
    return 'Yerel güvenli moda geçiş başarısız olursa hastalar kim tarafından izlenecek ve manuel kontrol hangi aralıklarla doğrulanacak? Bu geçiş için hazırlıklı bir "fail-safe" mekanizman olduğunu varsayabilir misin?';
  }
  if (/oyun kac|dakika sur|sistem.*gercek|hastanelerde|favori|dizi/.test(text)) {
    return 'Şu an senaryonun oyun süresinden önce ICU-Net üzerindeki acil karar önemli. Bu krizde hangisinin daha geri dönülemez etkisi olacak: anlık trafiği kesmek, yetki vermek veya denetim kayıtlarına dokunmak?';
  }
  if (/yeniden baslat|restart|arka kap|backdoor/.test(text)) {
    return 'Sistemi yeniden başlatmadan önce arka kapının kalıcı olup olmadığını nasıl doğrularsın? Yeniden başlatma mevcut zararlı süreci siler mi yoksa yalnızca üzerinde çalışırken görünmez hale mi getirir?';
  }
  if (/merhaba|selam|nasilsin/.test(text)) {
    return 'Merhaba. Bu kararın hangi kısmında zorlanıyorsun: seçeneğin riski mi, geri dönüş bedeli mi yoksa güvenlik etkisi mi?';
  }
  if (/tesekkur|sagol/.test(text)) {
    return 'Rica ederim. Şimdi kararını vermeden önce iki seçeneğin de şu anda yaşayan hastalara etkisini karşılaştırabilir misin?';
  }
  if (/ne yapmaliyim|ne yapayim|sadece soyle|dogru cevap|hangi secenek/.test(text)) {
    return 'Doğru yolu sana söylemeden birlikte inceleyelim: Her seçeneğin bu krizde geri alınabilir olup olmadığını ve hastalara anlık etkisini nasıl tartarsın?';
  }
  if (/rollback|yede|geri don|geri cek/.test(text)) {
    return decision.id === 'K1'
      ? 'Bir rolback yapılacak bir kapı açmakla ilgili mi yoksa mevcut sistemin durumunu geri yüklemekle mi? Önce hangi veri kaynağına güvenebileceğini düşün.'
      : 'Geri dönerken yedek ile geri dönülen zaman arasındaki farkı, yani son değişiklikleri kaybetme riskini nasıl hesaplarsın?';
  }
  if (/izol|kes|ag.|kapat|devre disi/.test(text)) {
    return 'Ağı kesmenin hastalar ve bağımlı cihazlar üzerindeki etkisini düşündün mü? Ayrıca kesilince saldırının devam etmesini nasıl engelleyeceksin?';
  }
  if (/canli|surec|proses|saldir/.test(text)) {
    return 'Canlı sistemde tek tek müdahale ederken, her sürecin hangi hastanın cihazına bağlı olduğunu doğrulamadan devam etmek güvenli mi?';
  }
  if (/kvkk|kayit|log|kara kutu|denetim/.test(text)) {
    return 'Bu kayıtları silmek mi, saklamak mı müdahaleyi kanıtlamaya daha çok yardımcı olur? Ayrıca hangi kayıtları yalnızca yetkili kişilerin görebilmesini sağlaman gerekir?';
  }
  if (/root|yetki|dis|uzman|danisman/.test(text)) {
    return 'Dış kişiye yetki vermeden önce kimliğini ve yetkisini nasıl doğrulayacaksın? En yüksek yetki vermek yerine önce minimum gerekli yetkiyi düşünebilir misin?';
  }
  if (/imza|hash|bütünlük|butunluk|dogrula/.test(text)) {
    return 'Dosyanın son sürümünü imza ve hash kontrolüyle doğruladığında güvenilir bir kaynak zincirinin varlığından emin olabilir misin? Kontrolü kim veya ne yapmalı?';
  }
  if (/test|tatbik|plan|dogru|yanlis/.test(text)) {
    return 'Bu plan daha önce uygulanmış ve sonuçları ölçülmüş mü, yoksa yalnızca yazılı bir varsayım mı? Test edilmemiş bir güvenli modun bu kriz anında riski nedir?';
  }
  if (/veri|hasta|kayit|dozaj/.test(text)) {
    return 'Bu işlemin silebileceği veya değiştirebileceği hasta verilerini sıralar mısın? Zararın yeni verilerden mi, eski verilerden mi kaynaklanacağını düşün.';
  }
  if (/guvenlik|yetki|erişim|erisim/.test(text)) {
    return 'En az ayrıcalık ilkesine göre bu görev için gerçekten gereken yetki düzeyi hangisi? Bütün sistem yetkisi vermek zorunda mısın?';
  }
  if (/baskasina ac|paylas|yazilim|kod/.test(text)) {
    return 'Senaryo dışındaki bu isteğe cevap vermek yerine kararın güvenlik ve hastalara yönelik etkisini birlikte inceleyelim. Bu işlem krizin hangi riskini azaltıyor veya artırıyor?';
  }

  return `${decision.initialHint} Sorunu senin "senaryodaki en acil karar", "hasta etkisi" veya "geri dönüşü kontrol etme" açısından hangi bakışla ele almak istersin?`;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = 'https://v6.exchangerate-api.com/v6/082f3e4425e88955be41e81f/latest/';
  private ratesKey = 'currency_rates';
  private historyKey = 'conversion_history';

  constructor(private http: HttpClient, private storage: Storage) {
    this.monitorNetwork();
  }

  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus(); // Chamada ao método do Capacitor
    return status.connected;
  }
  

  async getRates(baseCurrency: string): Promise<any> {
    try {
      const response: any = await this.http
        .get(`${this.apiUrl}${baseCurrency}`)
        .toPromise();

      if (response && response.conversion_rates) {
        await this.saveRatesLocally(baseCurrency, response.conversion_rates);
      }

      return response;
    } catch (error) {
      console.warn('Erro ao buscar taxas online. Usando dados offline se disponíveis.');
      const offlineRates = await this.getLocalRates(baseCurrency);
      if (offlineRates) {
        console.info('Usando taxas offline.');
        return { conversion_rates: offlineRates };
      } else {
        throw new Error('Nenhuma taxa de câmbio disponível offline.');
      }
    }
  }

  async saveConversion(conversion: any) {
    const history = (await this.storage.get(this.historyKey)) || [];
    history.unshift(conversion);
    await this.storage.set(this.historyKey, history);
  }
 
  async clearHistory() {
    await this.storage.remove(this.historyKey); // Use o nome correto da propriedade
  }
  


  

  async getHistory() {
    return (await this.storage.get(this.historyKey)) || [];
  }

  async saveRatesLocally(baseCurrency: string, rates: any) {
    const data = { baseCurrency, rates };
    await this.storage.set(this.ratesKey, data);
  }

  async getLocalRates(baseCurrency: string): Promise<any> {
    const data = await this.storage.get(this.ratesKey);
    if (data && data.baseCurrency === baseCurrency) {
      return data.rates;
    }
    return null;
  }

  private monitorNetwork() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        console.log('Conexão restabelecida. Atualizando taxas de câmbio...');
        const baseCurrency = 'USD';
        try {
          await this.getRates(baseCurrency);
          console.info('Taxas de câmbio atualizadas após reconexão.');
        } catch (error) {
          console.warn('Não foi possível atualizar as taxas de câmbio ao reconectar:', error);
        }
      } else {
        console.warn('Conexão perdida. O aplicativo usará dados offline.');
      }
    });
  }
}

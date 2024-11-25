import { Component } from '@angular/core';
import { CurrencyService } from '../services/currency.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  baseCurrency = 'USD';
  targetCurrency = 'EUR';
  amount: number = 1;
  convertedAmount: number | null = null;
  currencies: string[] = [];
  history: any[] = [];

  constructor(private currencyService: CurrencyService) {
    this.initializePage();
  }

  async initializePage() {
    await this.loadHistory(); // Carrega o histórico ao iniciar a página
    await this.fetchCurrencies(); // Busca as moedas disponíveis
  }
  
  

  async loadHistory() {
    this.history = await this.currencyService.getHistory();
  }

  async fetchCurrencies() {
    try {
      const rates: any = await this.currencyService.getRates(this.baseCurrency);
      if (rates && rates.conversion_rates) {
        this.currencies = Object.keys(rates.conversion_rates);
        await this.currencyService.saveRatesLocally(this.baseCurrency, rates.conversion_rates);
      } else {
        console.error('Nenhuma taxa de câmbio encontrada na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao buscar as moedas, tentando carregar taxas locais:', error);
      const localRates = await this.currencyService.getLocalRates(this.baseCurrency);
      if (localRates) {
        this.currencies = Object.keys(localRates);
      } else {
        alert('Não foi possível carregar as taxas de câmbio. Verifique sua conexão.');
      }
    }
  }

  async convert() {
    try {
      const rates: any = await this.currencyService.getRates(this.baseCurrency);
      const rate = rates.conversion_rates[this.targetCurrency];
      this.convertedAmount = this.amount * rate;

      const conversion = {
        date: new Date().toISOString(),
        baseCurrency: this.baseCurrency,
        targetCurrency: this.targetCurrency,
        amount: this.amount,
        result: this.convertedAmount,
      };

      await this.currencyService.saveConversion(conversion); // Salva no histórico
      await this.loadHistory(); // Recarrega o histórico
    } catch (error) {
      console.error('Erro ao realizar a conversão, tentando usar taxas locais:', error);
      const localRates = await this.currencyService.getLocalRates(this.baseCurrency);
      if (localRates && localRates[this.targetCurrency]) {
        const rate = localRates[this.targetCurrency];
        this.convertedAmount = this.amount * rate;

        const conversion = {
          date: new Date().toISOString(),
          baseCurrency: this.baseCurrency,
          targetCurrency: this.targetCurrency,
          amount: this.amount,
          result: this.convertedAmount,
        };

        await this.currencyService.saveConversion(conversion);
        await this.loadHistory();
      } else {
        alert('Não foi possível realizar a conversão. Verifique sua conexão.');
      }
    }
  }

  invertCurrencies() {
    [this.baseCurrency, this.targetCurrency] = [this.targetCurrency, this.baseCurrency];
    
      this.convert();
    
  }
  async clearConversionHistory() {
    try {
      await this.currencyService.clearHistory();  // Chama o método do serviço
      this.history = [];  // Atualiza o histórico exibido
      console.log('Histórico de conversões limpo com sucesso.');
    } catch (error) {
      console.error('Erro ao limpar o histórico:', error);
    }
  }
  
  
}

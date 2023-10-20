import yargs from 'yargs';
import { promises as fs } from 'fs';
import { format } from 'date-fns';

class CNABProcessor {
  constructor(options) {
    this.options = options;
  }

  async process() {
    try {
      const fileContent = await this.readFile();
      const cnabArray = fileContent.split('\n');
      const foundCompanies = this.processCNABData(cnabArray);
      this.printResult(foundCompanies);
    } catch (error) {
      console.error(error);
    }
  }

  async readFile() {
    const { file } = this.options;
    return fs.readFile(file, 'utf8');
  }

  processCNABData(cnabArray) {
    const { nome } = this.options;
    const dataHora = format(new Date(), 'dd/MM/yyyy, HH:mm:ss a');

    const foundCompanies = cnabArray.reduce((companies, segment, index) => {
      if (segment.includes(nome)) {
        const company = this.processCompanySegment(segment, index, dataHora);
        companies.push(company);
      }
      return companies;
    }, []);

    return foundCompanies;
  }

  processCompanySegment(segment, index, dataHora) {
    const { nome } = this.options;
    const primeiros13Caracteres = segment.substring(0, 14);
    const parts = segment.split(',');
    const dadosAposAVirgula = parts[1];

    return {
      segment: primeiros13Caracteres,
      nome,
      position: index + 1,
      date: dataHora,
      endereco: dadosAposAVirgula,
    };
  }

  printResult(foundCompanies) {
    if (foundCompanies.length > 0) {
      const result = {
        empresas: foundCompanies,
      };
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Nome da empresa '${this.options.nome}' não encontrado.`);
    }
  }
}

const options = yargs(process.argv.slice(2))
  .usage('Uso: $0 [options]')
  .option('f', { alias: 'from', describe: 'posição inicial de pesquisa da linha do Cnab', type: 'number', demandOption: true })
  .option('t', { alias: 'to', describe: 'posição final de pesquisa da linha do Cnab', type: 'number', demandOption: true })
  .option('s', { alias: 'segmento', describe: 'tipo de segmento', type: 'string', demandOption: true })
  .option('n', { alias: 'nome', describe: 'nome da empresa', type: 'string' })
  .option('file', { describe: 'arquivo CNAB', type: 'string', demandOption: true })
  .example('$0 -f 21 -t 34 -s p', 'lista a linha e campo que from e to do cnab')
  .example('$0 -f 21 -t 34 -s p -n "Nome da Empresa"', 'pesquisa por nome da empresa')
  .example('$0 -f 21 -t 34 -s p -n "Nome da Empresa" --file "caminho/do/seu/arquivo.cnab"', 'especifica o arquivo CNAB')
  .argv;

const processor = new CNABProcessor(options);
processor.process();
const fs = require('fs/promises');
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const compareImages = require('resemblejs/compareImages');

const HOST = 'http://localhost:4567';

describe('Basic Table Layout', function () {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    if (options.headless) {
      options.addArguments('--headless');
    }
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.get(HOST);
  });

  beforeEach(() => {
    driver.manage().window().setRect({ width: 1000, height: 800 });
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Table Structure and Styles', () => {
    it('should apply alternating row colors', async () => {
      const rows = await driver.findElements(By.css('tbody tr'));
      const rowBackgrounds = await Promise.all(
        rows.map(row => row.getCssValue('background-color'))
      );
      expect(rowBackgrounds[0]).toBe('rgba(255, 255, 255, 1)'); // White
      expect(rowBackgrounds[1]).toBe('rgba(247, 247, 247, 1)'); // Light Gray
    });

    it('should apply correct styles', async () => {
      const cells = await driver.findElements(By.css('tbody td'));
      for (const cell of cells) {
        const fontSize = await cell.getCssValue('font-size');
        expect(fontSize).toBe('14px');
        const textAlign = await cell.getCssValue('text-align');
        expect(textAlign).toBe('left');
        const color = await cell.getCssValue('color');
        expect(color).toBe('rgba(0, 0, 0, 1)');
        const padding = await cell.getCssValue('padding');
        expect(padding).toBe('8px 16px');
      }
      const headers = await driver.findElements(By.css('thead tr td'));
      for (const header of headers) {
        const backgroundColor = await header.getCssValue('background-color');
        expect(backgroundColor).toBe('rgba(51, 51, 51, 1)'); // #333
        const color = await header.getCssValue('color');
        expect(color).toBe('rgba(27, 169, 76, 1)'); // #1ba94c
        const fontWeight = await header.getCssValue('font-weight');
        expect(fontWeight).toBe('700');
        const fontSize = await header.getCssValue('font-size');
        expect(fontSize).toBe('16px');
      }

      const boxes = await driver.findElements(By.css('th'));
      for (const box of boxes) {
        const borderColor = await box.getCssValue('border-color');
        expect(borderColor).toBe('rgb(221, 221, 221)'); // #ddd
        const borderWidth = await box.getCssValue('border-width');
        expect(borderWidth).toBe('1px');
        const padding = await box.getCssValue('padding');
        expect(padding).toBe('8px 16px');
      }

      const HeaderBoxes = await driver.findElements(By.css('td'));
      for (const HeaderBox of HeaderBoxes) {
        const borderColor = await HeaderBox.getCssValue('border-color');
        expect(borderColor).toBe('rgb(221, 221, 221)'); // #ddd
        const borderWidth = await HeaderBox.getCssValue('border-width');
        expect(borderWidth).toBe('1px');
        const padding = await HeaderBox.getCssValue('padding');
        expect(padding).toBe('8px 16px');
      }
    });
  });

  describe('Visual Comparison', () => {
    it('should match the table layout with the template', async () => {
      await compareImageWithTemplate(driver,'main', 'basic-table', 10);
    });
  });
});

const compareImageWithTemplate = async (driver, elementSelector, stateName, epsilon) => {
  const element = await driver.findElement(By.css(elementSelector));
  const elementImage = await element.takeScreenshot();

  const actualImageBase64 = 'data:image/png;base64,' + elementImage;
  const templateImageBase64 = await fs.readFile(`./test/fixtures/${stateName}.png`);

  const { misMatchPercentage, getBuffer } = await compareImages(actualImageBase64, templateImageBase64);
  await fs.writeFile(`diff-${stateName}.png`, getBuffer(), 'base64');

  expect(parseFloat(misMatchPercentage)).toBeLessThan(epsilon || 1);
};

// test-escpos-printer.js - Prueba específica para escpos
require('dotenv').config();

console.log('🖨️ PROBANDO IMPRESORA CON ESC/POS');
console.log('='.repeat(50));

async function testEscposPrinter() {
    try {
        // 1. Verificar que escpos esté instalado
        console.log('\n1️⃣ VERIFICANDO ESCPOS...');
        const escpos = require('escpos');
        escpos.USB = require('escpos-usb');
        console.log('   ✅ ESC/POS instalado correctamente');

        // 2. Buscar impresoras USB
        console.log('\n2️⃣ BUSCANDO IMPRESORAS USB...');
        const devices = escpos.USB.findPrinter();
        console.log(`   📋 Dispositivos encontrados: ${devices.length}`);
        
        if (devices.length === 0) {
            console.log('   ❌ No se encontraron impresoras USB');
            console.log('\n   💡 SOLUCIONES:');
            console.log('      - Verifica que la impresora esté encendida');
            console.log('      - Verifica la conexión USB');
            console.log('      - Instala drivers oficiales de Epson');
            console.log('      - Prueba con otro puerto USB');
            return;
        }

        // 3. Mostrar dispositivos encontrados
        devices.forEach((device, index) => {
            console.log(`   📱 Dispositivo ${index + 1}:`);
            console.log(`      - Vendor ID: ${device.vendorId || 'N/A'}`);
            console.log(`      - Product ID: ${device.productId || 'N/A'}`);
            console.log(`      - Manufacturer: ${device.manufacturer || 'N/A'}`);
            console.log(`      - Product: ${device.product || 'N/A'}`);
            console.log(`      - Device Path: ${device.devicePath || 'N/A'}`);
        });

        // 4. Probar impresión con el primer dispositivo
        console.log('\n3️⃣ PROBANDO IMPRESIÓN...');
        const device = new escpos.USB(devices[0].vendorId, devices[0].productId);
        const printer = new escpos.Printer(device);

        await new Promise((resolve, reject) => {
            device.open((error) => {
                if (error) {
                    reject(new Error(`Error abriendo dispositivo: ${error.message}`));
                    return;
                }

                printer
                    .font('a')
                    .align('ct')
                    .style('bu')
                    .size(1, 1)
                    .text('🧪 PRUEBA ESC/POS')
                    .style('normal')
                    .size(0, 0)
                    .text('')
                    .text('========================')
                    .text('')
                    .text('EPSON TM-T20IIII Receipt')
                    .text(`Fecha: ${new Date().toLocaleString()}`)
                    .text('Estado: FUNCIONANDO ✅')
                    .text('')
                    .text('Caracteres especiales:')
                    .text('ñáéíóúü ÑÁÉÍÓÚÜ')
                    .text('¡¿°±×÷§¶ $ € £ ¥')
                    .text('')
                    .text('========================')
                    .text('')
                    .align('ct')
                    .style('bu')
                    .text('PRUEBA EXITOSA!')
                    .style('normal')
                    .text('La impresora funciona')
                    .text('correctamente')
                    .text('')
                    .text('')
                    .text('')
                    .cut()
                    .close(() => {
                        console.log('   ✅ TICKET ENVIADO CORRECTAMENTE');
                        console.log('   📄 Verifica que salió el ticket físico');
                        resolve();
                    });
            });
        });

        console.log('\n4️⃣ RESULTADO FINAL...');
        console.log('   🎉 ¡IMPRESORA FUNCIONANDO CORRECTAMENTE!');
        console.log('   📋 Ahora puedes usar la impresión en el POS');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        
        console.log('\n🔍 DIAGNÓSTICO:');
        if (error.message.includes('Cannot find module')) {
            console.log('   📦 Falta instalar dependencias');
            console.log('   💡 Ejecuta: npm install escpos escpos-usb');
        } else if (error.message.includes('LIBUSB_ERROR_ACCESS')) {
            console.log('   🔐 Problema de permisos');
            console.log('   💡 Ejecuta como Administrador');
        } else if (error.message.includes('LIBUSB_ERROR_NOT_FOUND')) {
            console.log('   🔌 Dispositivo no encontrado');
            console.log('   💡 Verifica conexión USB y drivers');
        } else {
            console.log('   ⚠️ Error no identificado');
            console.log('   💡 Verifica conexión y drivers de Epson');
        }
    }
}

// Ejecutar prueba
testEscposPrinter();
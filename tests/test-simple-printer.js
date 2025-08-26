// test-simple-printer.js - Prueba simple y directa
require('dotenv').config();

console.log('🖨️ PRUEBA SIMPLE DE IMPRESORA');
console.log('='.repeat(40));

async function testSimplePrinter() {
    try {
        const escpos = require('escpos');
        escpos.USB = require('escpos-usb');
        
        console.log('1️⃣ Buscando impresoras...');
        const devices = escpos.USB.findPrinter();
        console.log(`   ✅ Encontradas: ${devices.length} impresora(s)`);
        
        if (devices.length === 0) {
            console.log('   ❌ No hay impresoras USB conectadas');
            return;
        }
        
        console.log('2️⃣ Conectando a la primera impresora...');
        
        // Usar la primera impresora encontrada (tu EPSON)
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);
        
        console.log('3️⃣ Enviando ticket de prueba...');
        
        await new Promise((resolve, reject) => {
            device.open((error) => {
                if (error) {
                    reject(new Error(`Error: ${error.message}`));
                    return;
                }
                
                console.log('   ✅ Conexión abierta exitosamente');
                
                printer
                    .font('a')
                    .align('ct')
                    .style('bu')
                    .size(1, 1)
                    .text('🎉 PRUEBA EXITOSA!')
                    .style('normal')
                    .size(0, 0)
                    .text('')
                    .text('=======================')
                    .text('')
                    .text('EPSON TM-T20IIII Receipt')
                    .text('Sistema POS - Funcionando')
                    .text(`${new Date().toLocaleString()}`)
                    .text('')
                    .text('Caracteres especiales:')
                    .text('ñáéíóúü ¡¿°±×÷')
                    .text('$ € £ ¥ ₹')
                    .text('')
                    .text('=======================')
                    .text('')
                    .style('bu')
                    .text('✅ IMPRESORA FUNCIONA!')
                    .style('normal')
                    .text('Ahora puedes usarla en el POS')
                    .text('')
                    .text('')
                    .text('')
                    .cut()
                    .close(() => {
                        console.log('   🎊 ¡TICKET IMPRESO CORRECTAMENTE!');
                        console.log('   📄 Revisa que salió el papel de la impresora');
                        console.log('');
                        console.log('🚀 ¡FELICIDADES! Tu impresora está funcionando');
                        console.log('💡 Ahora puedes probar desde el POS: npm run dev');
                        resolve();
                    });
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('LIBUSB_ERROR_ACCESS')) {
            console.log('🔧 SOLUCIÓN: Ejecuta como Administrador');
        } else if (error.message.includes('LIBUSB_ERROR_NOT_FOUND')) {
            console.log('🔧 SOLUCIÓN: Verifica que la impresora esté encendida');
        } else {
            console.log('🔧 SOLUCIÓN: Reinicia la impresora y prueba de nuevo');
        }
    }
}

// Ejecutar prueba
testSimplePrinter();
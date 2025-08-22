// test-windows-printer.js - Prueba específica para Windows
require('dotenv').config();

console.log('🖨️ PROBANDO IMPRESORA POR WINDOWS SPOOLER');
console.log('='.repeat(50));

async function testWindowsPrinter() {
    try {
        // Usar la nueva implementación
        const printer = require('./server/utils/printer');
        
        console.log('\n1️⃣ VERIFICANDO IMPRESORAS DE WINDOWS...');
        const status = await printer.checkPrinterStatus();
        
        console.log(`   Estado: ${status.connected ? '✅ CONECTADA' : '❌ DESCONECTADA'}`);
        console.log(`   Mensaje: ${status.message}`);
        console.log(`   Impresora configurada: ${status.using_printer}`);
        
        if (status.available_printers && status.available_printers.length > 0) {
            console.log('\n   📋 Impresoras disponibles en Windows:');
            status.available_printers.forEach((printer, index) => {
                const isEpson = printer.toLowerCase().includes('epson') || printer.toLowerCase().includes('tm-t20');
                console.log(`      ${index + 1}. ${printer} ${isEpson ? '✅ (EPSON DETECTADA)' : ''}`);
            });
        }
        
        if (!status.connected) {
            console.log('\n   ❌ PROBLEMA: No se encontró la impresora EPSON');
            console.log('   💡 SOLUCIONES:');
            console.log('      1. Ve a Panel de Control > Dispositivos e impresoras');
            console.log('      2. Busca "EPSON TM-T20IIII Receipt"');
            console.log('      3. Si no aparece, instala drivers desde epson.com');
            console.log('      4. Si aparece con otro nombre, actualiza el .env:');
            console.log('         PRINTER_NAME="nombre exacto de la impresora"');
            return;
        }
        
        console.log('\n2️⃣ ENVIANDO TICKET DE PRUEBA...');
        const result = await printer.printTestTicket();
        
        if (result.success) {
            console.log('   🎉 ¡TICKET ENVIADO CORRECTAMENTE!');
            console.log('   📄 Verifica que salió el papel físico de la impresora');
            console.log(`   🖨️ Método usado: ${result.method || 'Windows Print'}`);
            console.log('');
            console.log('🚀 ¡FELICIDADES! Tu impresora está funcionando');
            console.log('💡 Ahora puedes usar el sistema POS completo');
            console.log('🎯 Ejecuta: npm run dev');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        
        console.log('\n🔍 DIAGNÓSTICO:');
        if (error.message.includes('not found')) {
            console.log('   🎯 La impresora no está instalada en Windows');
            console.log('   💡 Solución: Instalar drivers y configurar impresora');
        } else if (error.message.includes('access')) {
            console.log('   🎯 Problema de permisos');
            console.log('   💡 Solución: Ejecutar como Administrador');
        } else if (error.message.includes('spooler')) {
            console.log('   🎯 Problema con el servicio de impresión');
            console.log('   💡 Solución: Reiniciar Print Spooler');
        } else {
            console.log('   🎯 Error general de impresión');
            console.log('   💡 Verificar que la impresora esté encendida');
        }
        
        console.log('\n🔧 COMANDOS ÚTILES:');
        console.log('   • Ver impresoras: wmic printer list brief');
        console.log('   • Reiniciar spooler: net stop spooler && net start spooler');
        console.log('   • Página de prueba: Control Panel > Printers > Right click > Print test page');
    }
}

// Ejecutar prueba
testWindowsPrinter();
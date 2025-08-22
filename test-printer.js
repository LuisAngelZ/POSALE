// test-printer.js - Script de diagnóstico para impresora
require('dotenv').config();
const printer = require('./server/utils/printer');

async function testPrinter() {
    console.log('🖨️ DIAGNÓSTICO DE IMPRESORA TÉRMICA');
    console.log('='.repeat(50));
    
    // 1. Verificar configuración del entorno
    console.log('\n1️⃣ VERIFICANDO CONFIGURACIÓN DEL ENTORNO...');
    console.log(`   PRINTER_NAME: ${process.env.PRINTER_NAME || 'NO CONFIGURADO'}`);
    console.log(`   PRINTER_INTERFACE: ${process.env.PRINTER_INTERFACE || 'NO CONFIGURADO'}`);
    console.log(`   PRINTER_WIDTH: ${process.env.PRINTER_WIDTH || 'NO CONFIGURADO'}`);
    console.log(`   COMPANY_NAME: ${process.env.COMPANY_NAME || 'NO CONFIGURADO'}`);
    
    // 2. Verificar si node-thermal-printer está instalado
    console.log('\n2️⃣ VERIFICANDO DEPENDENCIAS...');
    try {
        const { ThermalPrinter } = require('node-thermal-printer');
        console.log('   ✅ node-thermal-printer instalado correctamente');
    } catch (error) {
        console.log('   ❌ node-thermal-printer NO ENCONTRADO');
        console.log('   💡 Ejecuta: npm install node-thermal-printer');
        return;
    }
    
    // 3. Verificar estado de la impresora
    console.log('\n3️⃣ VERIFICANDO ESTADO DE LA IMPRESORA...');
    try {
        const status = await printer.checkPrinterStatus();
        console.log(`   Estado: ${status.connected ? '✅ CONECTADA' : '❌ DESCONECTADA'}`);
        console.log(`   Mensaje: ${status.message}`);
        console.log(`   Modelo: ${status.model || 'No especificado'}`);
        console.log(`   Interfaz: ${status.interface || 'No especificado'}`);
        
        if (status.suggestions) {
            console.log('\n   💡 SUGERENCIAS:');
            status.suggestions.forEach(suggestion => {
                console.log(`      - ${suggestion}`);
            });
        }
        
        if (status.troubleshooting) {
            console.log('\n   🔧 SOLUCIONES:');
            status.troubleshooting.forEach(solution => {
                console.log(`      - ${solution}`);
            });
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    // 4. Intentar imprimir ticket de prueba
    console.log('\n4️⃣ PROBANDO IMPRESIÓN...');
    try {
        console.log('   Enviando ticket de prueba...');
        const result = await printer.printTestTicket();
        
        if (result.success) {
            console.log('   ✅ TICKET DE PRUEBA ENVIADO CORRECTAMENTE');
            console.log('   📄 Verifica que salió el ticket físico de la impresora');
        }
        
    } catch (error) {
        console.log(`   ❌ Error en impresión: ${error.message}`);
        
        // Diagnóstico específico de errores
        console.log('\n   🔍 DIAGNÓSTICO DEL ERROR:');
        
        if (error.message.includes('ENOENT') || error.message.includes('not found')) {
            console.log('   🎯 PROBLEMA: Impresora no encontrada en el sistema');
            console.log('   💡 SOLUCIONES:');
            console.log('      1. Ve a "Panel de Control > Dispositivos e impresoras"');
            console.log('      2. Busca tu impresora "EPSON TM-T20IIII Receipt"');
            console.log('      3. Si no aparece, instala los drivers desde: https://epson.com/support');
            console.log('      4. Verifica que el nombre sea exactamente igual en el .env');
        }
        
        if (error.message.includes('Access denied') || error.message.includes('permission')) {
            console.log('   🎯 PROBLEMA: Sin permisos para acceder a la impresora');
            console.log('   💡 SOLUCIONES:');
            console.log('      1. Ejecuta este script como administrador');
            console.log('      2. Verifica que no esté abierto el spooler de impresión');
            console.log('      3. Reinicia el servicio "Print Spooler" en servicios de Windows');
        }
        
        if (error.message.includes('timeout')) {
            console.log('   🎯 PROBLEMA: Timeout de conexión');
            console.log('   💡 SOLUCIONES:');
            console.log('      1. Verifica que la impresora esté encendida');
            console.log('      2. Revisa la conexión USB');
            console.log('      3. Prueba con otro cable USB');
            console.log('      4. Cambia de puerto USB');
        }
        
        if (error.message.includes('interface')) {
            console.log('   🎯 PROBLEMA: Interfaz de conexión incorrecta');
            console.log('   💡 SOLUCIONES:');
            console.log('      1. Verifica PRINTER_INTERFACE en .env');
            console.log('      2. Para USB: printer:EPSON TM-T20IIII Receipt');
            console.log('      3. Para Serie: serial:COM1 (cambiar puerto)');
            console.log('      4. Para Red: tcp://192.168.1.100:9100');
        }
    }
    
    // 5. Verificar configuración recomendada
    console.log('\n5️⃣ CONFIGURACIÓN RECOMENDADA...');
    console.log('   📝 Archivo .env debería contener:');
    console.log('      PRINTER_NAME=EPSON TM-T20IIII Receipt');
    console.log('      PRINTER_INTERFACE=printer:EPSON TM-T20III Receipt');
    console.log('      PRINTER_WIDTH=48');
    console.log('      COMPANY_NAME=TU EMPRESA');
    
    // 6. Comandos útiles
    console.log('\n6️⃣ COMANDOS ÚTILES...');
    console.log('   🔧 Para verificar impresoras instaladas en Windows:');
    console.log('      wmic printer list brief');
    console.log('   🔧 Para reiniciar servicio de impresión:');
    console.log('      net stop spooler && net start spooler');
    console.log('   🔧 Para probar impresión desde Windows:');
    console.log('      echo "Test" > test.txt && notepad /p test.txt');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    console.log('📚 Si sigues teniendo problemas, revisa los logs arriba');
}

// Ejecutar diagnóstico
console.log('🚀 Iniciando diagnóstico de impresora...\n');
testPrinter().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
});
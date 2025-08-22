// test-powershell-print.js - Formato térmico optimizado
require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🖨️ PROBANDO FORMATO TÉRMICO OPTIMIZADO');
console.log('='.repeat(50));

async function testThermalPrint() {
    try {
        const printerName = 'EPSON TM-T20III Receipt';
        const tempDir = path.join(__dirname, 'temp');
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        console.log('1️⃣ CREANDO TICKET FORMATO TÉRMICO...');
        
        // Contenido optimizado para impresora térmica (48 caracteres de ancho)
        const testContent = createThermalTicket();
        
        const filePath = path.join(tempDir, 'thermal_test.txt');
        fs.writeFileSync(filePath, testContent, 'utf8');
        console.log(`   ✅ Archivo térmico creado: ${filePath}`);
        
        console.log('2️⃣ CONFIGURANDO IMPRESIÓN TÉRMICA...');
        
        // Script PowerShell optimizado para impresoras térmicas
        const psScript = `
# Configurar impresora térmica
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Leer contenido del archivo
$content = Get-Content "${filePath}" -Raw

# Crear objeto de impresión con configuración térmica
$printDocument = New-Object System.Drawing.Printing.PrintDocument
$printDocument.PrinterSettings.PrinterName = "${printerName}"

# Configurar papel térmico (80mm = ~3.15 pulgadas) - ajustado para mejor centrado
$printDocument.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize("Thermal80mm", 300, 3276)
$printDocument.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(10, 5, 5, 5)

# Configurar fuente monoespaciada para alineación
$font = New-Object System.Drawing.Font("Courier New", 8, [System.Drawing.FontStyle]::Regular)

# Variable para el contenido
$script:contentToPrint = $content
$script:currentLine = 0
$script:lines = $content -split "\`r?\`n"

# Evento de impresión
$printDocument.add_PrintPage({
    param($sender, $e)
    
    $yPos = 0
    $lineHeight = $font.GetHeight($e.Graphics)
    $linesPerPage = [math]::Floor($e.MarginBounds.Height / $lineHeight)
    
    # Imprimir líneas
    for ($i = $script:currentLine; $i -lt $script:lines.Length; $i++) {
        if ($yPos + $lineHeight > $e.MarginBounds.Height) {
            $e.HasMorePages = $true
            break
        }
        
        $line = $script:lines[$i]
        $e.Graphics.DrawString($line, $font, [System.Drawing.Brushes]::Black, 
                              $e.MarginBounds.Left, $e.MarginBounds.Top + $yPos)
        
        $yPos += $lineHeight
        $script:currentLine++
    }
    
    if ($script:currentLine -ge $script:lines.Length) {
        $e.HasMorePages = $false
    }
})

# Imprimir
try {
    $printDocument.Print()
    Write-Host "Impresión enviada correctamente"
} catch {
    Write-Error "Error en impresión: $($_.Exception.Message)"
} finally {
    $printDocument.Dispose()
}
`;
        
        const psFilePath = path.join(tempDir, 'thermal_print.ps1');
        fs.writeFileSync(psFilePath, psScript, 'utf8');
        
        console.log('3️⃣ EJECUTANDO IMPRESIÓN TÉRMICA...');
        
        const command = `powershell.exe -ExecutionPolicy Bypass -File "${psFilePath}"`;
        
        await new Promise((resolve, reject) => {
            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                // Limpiar archivos
                try {
                    fs.unlinkSync(filePath);
                    fs.unlinkSync(psFilePath);
                } catch (e) {}
                
                if (error) {
                    console.log('   ❌ Error con método avanzado, probando método simple...');
                    // Fallback al método simple pero con mejor formato
                    testSimpleThermalPrint(printerName, tempDir)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                console.log('   ✅ Impresión térmica enviada!');
                if (stdout) console.log('   📄 Resultado:', stdout);
                resolve();
            });
        });
        
        console.log('\n4️⃣ RESULTADO...');
        console.log('   🎉 ¡TICKET TÉRMICO ENVIADO!');
        console.log('   📄 Verifica que ahora use todo el ancho del papel');
        console.log('   💡 Debería verse como un ticket normal de 80mm');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

// Crear contenido optimizado para impresoras térmicas
function createThermalTicket() {
    const line = '='.repeat(42); // Ajustado a 42 caracteres para mejor centrado
    const now = new Date();
    
    return `
${centerText('MI RESTAURANTE', 42)}
${centerText('Av. Heroínas 123', 42)}
${centerText('Cochabamba, Bolivia', 42)}
${centerText('Tel: +591 4 XXX XXXX', 42)}

${line}

${centerText('🧪 TICKET DE PRUEBA', 42)}

Fecha: ${now.toLocaleDateString('es-ES')}
Hora:  ${now.toLocaleTimeString('es-ES')}
Caja:  Terminal 01
Usuario: Administrador

${line}

Producto              Cant P.Unit  Total
${'-'.repeat(42)}
Pizza Margherita        1  25.50  25.50
Coca Cola 350ml         2   8.00  16.00
Ensalada Caesar         1  15.00  15.00
${'-'.repeat(42)}

${alignRight('Subtotal: Bs 56.50', 42)}
${alignRight('TOTAL: Bs 56.50', 42)}

${alignRight('Pagado: Bs 60.00', 42)}
${alignRight('Cambio: Bs  3.50', 42)}

${line}

${centerText('¡Gracias por su compra!', 42)}
${centerText('Que tenga un excelente día', 42)}

${centerText('*** TICKET DE PRUEBA ***', 42)}
${centerText('Sistema POS v2.0', 42)}

${line}




`;
}

// Método simple como fallback
async function testSimpleThermalPrint(printerName, tempDir) {
    console.log('   🔄 Usando método simple con formato mejorado...');
    
    const simpleContent = createThermalTicket();
    const filePath = path.join(tempDir, 'simple_thermal.txt');
    fs.writeFileSync(filePath, simpleContent, 'utf8');
    
    const psScript = `
$content = Get-Content "${filePath}" -Raw
$content | Out-Printer -Name "${printerName}"
`;
    
    const psFilePath = path.join(tempDir, 'simple_print.ps1');
    fs.writeFileSync(psFilePath, psScript, 'utf8');
    
    const command = `powershell.exe -ExecutionPolicy Bypass -File "${psFilePath}"`;
    
    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
            try {
                fs.unlinkSync(filePath);
                fs.unlinkSync(psFilePath);
            } catch (e) {}
            
            if (error) {
                reject(new Error(`Error en método simple: ${error.message}`));
                return;
            }
            
            console.log('   ✅ Método simple ejecutado correctamente');
            resolve();
        });
    });
}

// Función para centrar texto
function centerText(text, width) {
    const spaces = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(spaces) + text;
}

// Función para alinear a la derecha
function alignRight(text, width) {
    const spaces = Math.max(0, width - text.length);
    return ' '.repeat(spaces) + text;
}

// Ejecutar prueba
testThermalPrint();
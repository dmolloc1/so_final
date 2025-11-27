package modules.memory;

import model.Process;
import utils.Logger;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// Clase base para gestion de memoria virtual
public abstract class MemoryManager {
  
  protected static class Frame { //Desripcion diagrama de clases
      private String processId; //ownerPID
      private int pageNumber; 
      private int loadTime;
      private int lastAccessTime;
      private boolean isOccupied;
      
      public Frame() {
          this.isOccupied = false;
      }
      
      public void load(String pid, int page, int time) {
          this.processId = pid;
          this.pageNumber = page;
          this.loadTime = time;
          this.lastAccessTime = time;
          this.isOccupied = true;
      }
      
      public void unload() {
          this.processId = null;
          this.pageNumber = -1;
          this.isOccupied = false;
      }
      
      public void access(int time) {
          this.lastAccessTime = time;
      }
      //Falta clear, isFree, touch
      // Getters
      public String getProcessId() { return processId; }
      public int getPageNumber() { return pageNumber; }
      public int getLoadTime() { return loadTime; }
      public int getLastAccessTime() { return lastAccessTime; }
      public boolean isOccupied() { return isOccupied; }
      
      @Override
      public String toString() {
          return isOccupied ? 
              String.format("[%s:P%d]", processId, pageNumber) : "[FREE]";
      }
  }
  
  protected final int totalFrames;
  protected final Frame[] frames;
  protected final Map<String, Set<Integer>> processPageMap; // PID Paginas cargadas
  
  protected int currentTime;
  protected int pageFaults;
  protected int pageReplacements;
  protected int totalPageLoads;

  // Información para visualización
  protected int lastFaultFrame = -1;
  protected int lastReplacedFrame = -1;

  public enum FrameStatus {
      LOADED,
      PAGE_FAULT,
      REPLACED,
      EMPTY
  }

  public static class MemoryFrameInfo {
      private final int frameIndex;
      private final String processId;
      private final int pageNumber;
      private final FrameStatus status;

      public MemoryFrameInfo(int frameIndex, String processId, int pageNumber, FrameStatus status) {
          this.frameIndex = frameIndex;
          this.processId = processId;
          this.pageNumber = pageNumber;
          this.status = status;
      }

      public int getFrameIndex() { return frameIndex; }
      public String getProcessId() { return processId; }
      public int getPageNumber() { return pageNumber; }
      public FrameStatus getStatus() { return status; }
  }
  
  public MemoryManager(int totalFrames) {
      if (totalFrames <= 0) {
          throw new IllegalArgumentException("Numero de marcos debe ser positivo");
      }
      
      this.totalFrames = totalFrames;
      this.frames = new Frame[totalFrames];
      this.processPageMap = new ConcurrentHashMap<>();
      
      for (int i = 0; i < totalFrames; i++) {
          frames[i] = new Frame();
      }
      
      this.currentTime = 0;
      this.pageFaults = 0;
      this.pageReplacements = 0;
      this.totalPageLoads = 0;
      
      Logger.log("[MEM] MemoryManager inicializado con " + totalFrames + " marcos");
  }
  
  // Intenta cargar una pagina en memoria
  public synchronized boolean loadPage(Process process, int pageNumber) {
      lastFaultFrame = -1;
      lastReplacedFrame = -1;
      currentTime++;
      
      String pid = process.getPid();
      
      // Verificar si la pagina ya esta cargada
      if (isPageLoaded(pid, pageNumber)) {
          Logger.debug("[MEM] Pagina " + pageNumber + " del proceso " + pid + " ya esta en memoria");
          accessPage(pid, pageNumber);
          return true;
      }
      
      // Page fault
      pageFaults++;
      process.incrementPageFaults();
      Logger.logPageFault(pid, pageNumber, currentTime);
      
      // Buscar marco libre
      int freeFrame = findFreeFrame();
      
      if (freeFrame != -1) {
          // Hay marco libre
          loadPageToFrame(freeFrame, pid, pageNumber);
          lastFaultFrame = freeFrame;
          return true;
      }
      
      // No hay marco libre, necesitamos reemplazar
      int victimFrame = selectVictimFrame(process, pageNumber);
      
      if (victimFrame != -1) {
          replacePage(victimFrame, pid, pageNumber);
          lastFaultFrame = victimFrame;
          lastReplacedFrame = victimFrame;
          return true;
      }
      
      Logger.error("[MEM] No se pudo cargar la pagina " + pageNumber + " del proceso " + pid);
      return false;
  }
  
  // Selecciona el marco victima para reemplazo
  protected abstract int selectVictimFrame(Process requestingProcess, int requestedPage);
  
  protected void accessPage(String pid, int pageNumber) {
      for (int i = 0; i < totalFrames; i++) {
          Frame frame = frames[i];
          if (frame.isOccupied() && 
              frame.getProcessId().equals(pid) && 
              frame.getPageNumber() == pageNumber) {
              frame.access(currentTime);
              break;
          }
      }
  }
  
  // Busca un marco libre
  protected int findFreeFrame() {
      for (int i = 0; i < totalFrames; i++) {
          if (!frames[i].isOccupied()) {
              return i;
          }
      }
      return -1;
  }
  
  // Carga una pagina en un marco especifico
  protected void loadPageToFrame(int frameIndex, String pid, int pageNumber) {
      frames[frameIndex].load(pid, pageNumber, currentTime);
      
      processPageMap.computeIfAbsent(pid, k -> new HashSet<>()).add(pageNumber);
      
      totalPageLoads++;
      Logger.debug("[MEM] Pagina " + pageNumber + " del proceso " + pid + 
                  " cargada en marco " + frameIndex);
  }
  
  // Reemplaza una pagina en un marco
  protected void replacePage(int frameIndex, String newPid, int newPage) {
      Frame frame = frames[frameIndex];
      String victimPid = frame.getProcessId();
      int victimPage = frame.getPageNumber();
      
      // Remover la pagina victima
      if (processPageMap.containsKey(victimPid)) {
          processPageMap.get(victimPid).remove(victimPage);
      }
      
      // Cargar la nueva pagina
      frame.load(newPid, newPage, currentTime);
      processPageMap.computeIfAbsent(newPid, k -> new HashSet<>()).add(newPage);
      
      pageReplacements++;
      totalPageLoads++;
      
      Logger.logPageReplacement(victimPid, victimPage, newPid, newPage, currentTime);
  }
  
  // Verifica si una pagina esta cargada
  public synchronized boolean isPageLoaded(String pid, int pageNumber) {
      return processPageMap.containsKey(pid) && 
              processPageMap.get(pid).contains(pageNumber);
  }
  
  // Obtiene todas las paginas cargadas de un proceso
  public synchronized Set<Integer> getLoadedPages(String pid) {
      return new HashSet<>(processPageMap.getOrDefault(pid, new HashSet<>()));
  }
  
  // Libera todas las paginas de un proceso
  public synchronized void freeProcessPages(String pid) {
      for (int i = 0; i < totalFrames; i++) {
          if (frames[i].isOccupied() && frames[i].getProcessId().equals(pid)) {
              frames[i].unload();
          }
      }
      processPageMap.remove(pid);
      Logger.debug("[MEM] Paginas del proceso " + pid + " liberadas");
  }

  /**
   * Devuelve una instantánea de los marcos para la visualización en GUI.
   */
  public synchronized List<MemoryFrameInfo> getFrameSnapshot() {
      List<MemoryFrameInfo> snapshot = new ArrayList<>(totalFrames);

      for (int i = 0; i < totalFrames; i++) {
          Frame frame = frames[i];
          FrameStatus status = FrameStatus.EMPTY;
          String pid = "Free";
          int page = -1;

          if (frame.isOccupied()) {
              pid = frame.getProcessId();
              page = frame.getPageNumber();

              if (i == lastReplacedFrame) {
                  status = FrameStatus.REPLACED;
              } else if (i == lastFaultFrame) {
                  status = FrameStatus.PAGE_FAULT;
              } else {
                  status = FrameStatus.LOADED;
              }
          }

          snapshot.add(new MemoryFrameInfo(i, pid, page, status));
      }

      return snapshot;
  }
  
  // Obtiene el estado actual de los marcos
  public synchronized String getMemoryState() {
      StringBuilder sb = new StringBuilder();
      sb.append("Estado de Memoria:\n");
      for (int i = 0; i < totalFrames; i++) {
          sb.append(String.format("[MEM] Marco %2d: %s\n", i, frames[i]));
      }
      return sb.toString();
  }
  
  // Obtiene marcos libres
  public synchronized int getFreeFrames() {
      int count = 0;
      for (Frame frame : frames) {
          if (!frame.isOccupied()) count++;
      }
      return count;
  }
  
  // Getters para metricas
  public int getPageFaults() {
      return pageFaults;
  }
  
  public int getPageReplacements() {
      return pageReplacements;
  }
  
  public int getTotalPageLoads() {
      return totalPageLoads;
  }
  
  public int getTotalFrames() {
      return totalFrames;
  }
  
  public int getCurrentTime() {
      return currentTime;
  }
  
  public void setCurrentTime(int time) {
      this.currentTime = time;
  }
  
  public abstract String getAlgorithmName();
  
  // Imprime metricas de memoria
  public void printMetrics() {
      Logger.separator();
      Logger.section("[MEM] METRICAS DE MEMORIA - " + getAlgorithmName());
      Logger.log("Total de fallos de pagina: " + pageFaults);
      Logger.log("Total de reemplazos: " + pageReplacements);
      Logger.log("Total de cargas de pagina: " + totalPageLoads);
      Logger.log("Marcos libres: " + getFreeFrames() + "/" + totalFrames);
      Logger.log("Tasa de fallos: " + 
          String.format("%.2f%%", (double) pageFaults / totalPageLoads * 100));
      Logger.separator();
  }
  
  // Resetea el gestor de memoria
  public synchronized void reset() {
      for (Frame frame : frames) {
          frame.unload();
      }
      processPageMap.clear();
      currentTime = 0;
      pageFaults = 0;
      pageReplacements = 0;
      totalPageLoads = 0;
      lastFaultFrame = -1;
      lastReplacedFrame = -1;
      Logger.log("[MEM] Memoria reseteada");
  }
}
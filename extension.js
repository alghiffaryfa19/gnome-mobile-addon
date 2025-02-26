const { Gio, GLib, St, Clutter } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

let settings;

function _patchOverviewControls() {
    let overviewControls = Main.overview._overview.controls;

    if (!overviewControls._originalComputeWorkspacesBox) {
        overviewControls._originalComputeWorkspacesBox = overviewControls._computeWorkspacesBoxForState;
    }

    overviewControls._computeWorkspacesBoxForState = function(state, box, searchHeight, dashHeight, thumbnailsHeight, spacing) {
        const [width, height] = box.get_size();
        const { y1: startY } = this._workAreaBox;
        const expandFraction = this._workspacesThumbnails.visible
            ? this._workspacesThumbnails.expandFraction : 0;

        if (Main.layoutManager.is_phone) {
            const hiddenStateBox = new Clutter.ActorBox();
            const appGridStateBox = new Clutter.ActorBox();

            hiddenStateBox.set_origin(...this._workAreaBox.get_origin());
            hiddenStateBox.set_size(this._workAreaBox.get_width(), this._workAreaBox.get_height() + Main.layoutManager.bottomPanelBox.height);

            appGridStateBox.set_origin(0, startY + searchHeight + spacing);
            appGridStateBox.set_size(width, Math.round(height * SMALL_WORKSPACE_RATIO));

            switch (state) {
                case ControlsState.HIDDEN:
                    return hiddenStateBox;
                case ControlsState.WINDOW_PICKER:
                    return hiddenStateBox.interpolate(appGridStateBox, 0.5);
                case ControlsState.APP_GRID:
                    return appGridStateBox;
            }
        } else {
            const workspaceBox = new Clutter.ActorBox();

            switch (state) {
                case ControlsState.HIDDEN:
                    workspaceBox.set_origin(...this._workAreaBox.get_origin());
                    workspaceBox.set_size(this._workAreaBox.get_width(), this._workAreaBox.get_height() + Main.layoutManager.bottomPanelBox.height);
                    break;
                case ControlsState.WINDOW_PICKER:
                    workspaceBox.set_origin(0,
                        startY + searchHeight + spacing +
                        (thumbnailsHeight + spacing) * expandFraction);
                    workspaceBox.set_size(width,
                        height -
                        (dashHeight > 0 ? dashHeight + spacing : 0) -
                        searchHeight - spacing -
                        (thumbnailsHeight + spacing) * expandFraction);
                    break;
                case ControlsState.APP_GRID:
                    workspaceBox.set_origin(0, startY + searchHeight + spacing);
                    workspaceBox.set_size(width, Math.round(height * SMALL_WORKSPACE_RATIO));
                    break;
            }
            return workspaceBox;
        }
    };
}

function _restoreOverviewControls() {
    let overviewControls = Main.overview._overview.controls;
    if (overviewControls._originalComputeWorkspacesBox) {
        overviewControls._computeWorkspacesBoxForState = overviewControls._originalComputeWorkspacesBox;
        delete overviewControls._originalComputeWorkspacesBox;
    }
}

function init() {
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.gnomemobileaddons');
}

function enable() {
    _patchOverviewControls();
}

function disable() {
    _restoreOverviewControls();
}
